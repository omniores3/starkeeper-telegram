package main

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"syscall"
	"time"
	_ "time/tzdata" // embed IANA time zones for static single-file builds

	"tgkeeper/internal/bot"
	"tgkeeper/internal/config"
	"tgkeeper/internal/controller"
	"tgkeeper/internal/model"
	"tgkeeper/internal/scheduler"
	"tgkeeper/internal/security"
	"tgkeeper/internal/seed"
	"tgkeeper/internal/telegram"
	"tgkeeper/internal/view"
	"tgkeeper/internal/webhook"
)

// applyPendingRestore swaps in a database uploaded from the backup page. It runs
// before the store is opened, and keeps the previous database next to it.
func applyPendingRestore(dbPath string, logger *slog.Logger) {
	dir := filepath.Dir(dbPath)
	pending := filepath.Join(dir, "restore.db")
	if _, err := os.Stat(pending); err != nil {
		return
	}
	backup := filepath.Join(dir, "pre-restore-"+time.Now().Format("20060102-150405")+".db")
	if _, err := os.Stat(dbPath); err == nil {
		if err := os.Rename(dbPath, backup); err != nil {
			logger.Error("move current database aside", "err", err)
			return
		}
	}
	_ = os.Remove(dbPath + "-wal")
	_ = os.Remove(dbPath + "-shm")
	if err := os.Rename(pending, dbPath); err != nil {
		logger.Error("apply database restore", "err", err)
		return
	}
	logger.Warn("database restored from upload", "backup", backup)
}

func main() {
	logger := slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelInfo}))
	slog.SetDefault(logger)

	cfg, err := config.Load()
	if err != nil {
		logger.Error("load config", "err", err)
		os.Exit(1)
	}
	loc := cfg.Location()

	applyPendingRestore(cfg.DBPath, logger)
	store, err := model.Open(cfg.DBPath, loc)
	if err != nil {
		logger.Error("open database", "err", err)
		os.Exit(1)
	}
	defer store.Close()

	if err := seed.Ensure(store, cfg.AdminUser, cfg.AdminPass, cfg.SeedDemo, loc); err != nil {
		logger.Error("seed database", "err", err)
		os.Exit(1)
	}
	// A token saved from the console wins over the environment variable.
	if enc := store.GetSetting("bot_token", ""); enc != "" {
		if token, err := security.DecryptString(enc, cfg.SessionSecret); err == nil && token != "" {
			cfg.BotToken = token
		} else if err != nil {
			logger.Warn("stored bot token cannot be decrypted; using BOT_TOKEN", "err", err)
		}
	}

	client := telegram.New(cfg.BotToken)
	botService := bot.New(client, store, cfg, loc, logger)
	botService.ID = 1
	botService.Name = "主机器人"
	dispatcher := webhook.New(store, logger)
	botService.Webhook = dispatcher
	pool := bot.NewPool(botService)
	botService.Pool = pool
	sch := scheduler.New(store, botService, loc, logger)

	v, err := view.New(loc)
	if err != nil {
		logger.Error("parse templates", "err", err)
		os.Exit(1)
	}
	app := controller.New(store, botService, sch, cfg, v, logger, loc)
	app.Webhook = dispatcher
	app.BotPool = pool

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	pool.SetContext(ctx)
	go botService.Run(ctx)
	app.LoadBotAccounts(ctx)
	go app.RunWorkers(ctx)
	go sch.Run(ctx)

	srv := &http.Server{
		Addr:              cfg.Addr,
		Handler:           app.Router(),
		ReadHeaderTimeout: 10 * time.Second,
		ReadTimeout:       30 * time.Second,
		WriteTimeout:      70 * time.Second,
		IdleTimeout:       120 * time.Second,
	}

	go func() {
		logger.Info("StarKeeper console ready", "url", "http://"+cfg.Addr, "demo", cfg.DemoMode(),
			"admin", cfg.AdminUser, "db", cfg.DBPath)
		if cfg.DemoMode() {
			logger.Info("demo mode: BOT_TOKEN is empty, Telegram delivery is disabled; seeded data is shown")
			logger.Info("default login", "username", cfg.AdminUser, "password", cfg.AdminPass)
		}
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("http server", "err", err)
			cancel()
		}
	}()

	sig := make(chan os.Signal, 1)
	signal.Notify(sig, os.Interrupt, syscall.SIGTERM)
	<-sig
	logger.Info("shutting down")
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Warn("shutdown", "err", err)
	}
	cancel()
	time.Sleep(300 * time.Millisecond)
	fmt.Println("bye ✦")
}
