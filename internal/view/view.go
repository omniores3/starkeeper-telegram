package view

import (
	"bytes"
	"embed"
	"encoding/json"
	"fmt"
	"html"
	"html/template"
	"io/fs"
	"regexp"
	"strings"
	"time"
)

//go:embed templates/*.html static
var embedded embed.FS

type View struct {
	Loc   *time.Location
	pages map[string]*template.Template
	login *template.Template
	mini  *template.Template
	funcs template.FuncMap
}

var pageNames = []string{
	"dashboard", "groups", "group", "templates", "schedules", "checkin",
	"redpackets", "campaigns", "ads", "antispam", "bot", "audit", "security", "shop", "ai", "stars", "developer", "tickets", "health", "backup", "bots", "automations", "team", "reports", "invites", "memberships", "market", "settings", "error",
}

func New(loc *time.Location) (*View, error) {
	v := &View{Loc: loc, pages: map[string]*template.Template{}}
	v.funcs = template.FuncMap{
		"json": func(v any) template.JS {
			b, err := json.Marshal(v)
			if err != nil {
				return template.JS("null")
			}
			return template.JS(b)
		},
		"fmtTime": func(ts int64) string {
			if ts <= 0 {
				return "—"
			}
			return time.Unix(ts, 0).In(loc).Format("2006-01-02 15:04")
		},
		"fmtDate": func(ts int64) string {
			if ts <= 0 {
				return "—"
			}
			return time.Unix(ts, 0).In(loc).Format("01月02日")
		},
		"fmtShortDate": func(ts int64) string {
			if ts <= 0 {
				return "—"
			}
			return time.Unix(ts, 0).In(loc).Format("01/02")
		},
		"fmtClock": func(ts int64) string {
			if ts <= 0 {
				return "—"
			}
			return time.Unix(ts, 0).In(loc).Format("15:04")
		},
		"dateInput": func(ts int64) string {
			if ts <= 0 {
				return ""
			}
			return time.Unix(ts, 0).In(loc).Format("2006-01-02T15:04")
		},
		"timeAgo":   func(ts int64) string { return timeAgo(ts, loc) },
		"timeUntil": func(ts int64) string { return timeUntil(ts, loc) },
		"plain":     plainText,
		"initials":  func(s string) string { return initials(s) },
		"avatar":    func(s string) string { return avatarClass(s) },
		"fmtNum":    func(n int) string { return formatNum(n) },
		"add":       func(a, b int) int { return a + b },
		"seq": func(n int) []int {
			out := make([]int, n)
			for i := range out {
				out[i] = i + 1
			}
			return out
		},
		"percent": func(a, b int) int {
			if b <= 0 {
				return 0
			}
			return a * 100 / b
		},
		"sceneLabel":  sceneLabel,
		"statusLabel": statusLabel,
		"modeLabel":   modeLabel,
		"actionLabel": actionLabel,
		"maskToken": func(s string) string {
			if len(s) <= 10 {
				return strings.Repeat("•", len(s))
			}
			return s[:6] + "••••••" + s[len(s)-4:]
		},
		"kindLabel":  kindLabel,
		"auditLabel": auditLabel,
		"auditTone":  auditTone,
		"fmtBytes":   fmtBytes,
		"roleLabel":  roleLabel,
		"safeHTML":   func(s string) template.HTML { return template.HTML(s) },
		"joinGroups": func(ids string) string {
			return strings.Trim(ids, "[]")
		},
		"default": func(v, fallback string) string {
			if strings.TrimSpace(v) == "" {
				return fallback
			}
			return v
		},
		"lower": strings.ToLower,
		"contains": func(s, sub string) bool {
			return strings.Contains(strings.ToLower(s), strings.ToLower(sub))
		},
		"rune": func(s string, n int) string {
			r := []rune(s)
			if len(r) <= n {
				return s
			}
			return string(r[:n]) + "…"
		},
		"btnLabel": func(t string) string {
			if t == "url" {
				return "链接"
			}
			return "回调"
		},
	}
	login, err := template.New("login.html").Funcs(v.funcs).ParseFS(embedded, "templates/login.html")
	if err != nil {
		return nil, err
	}
	v.login = login
	mini, err := template.New("miniapp.html").Funcs(v.funcs).ParseFS(embedded, "templates/miniapp.html")
	if err != nil {
		return nil, err
	}
	v.mini = mini
	for _, name := range pageNames {
		t, err := template.New("base.html").Funcs(v.funcs).ParseFS(embedded,
			"templates/base.html", "templates/"+name+".html")
		if err != nil {
			return nil, fmt.Errorf("parse %s: %w", name, err)
		}
		v.pages[name] = t
	}
	return v, nil
}

func (v *View) Render(name string, data any) ([]byte, error) {
	t, ok := v.pages[name]
	if !ok {
		return nil, fmt.Errorf("unknown page %q", name)
	}
	var buf bytes.Buffer
	if err := t.ExecuteTemplate(&buf, "base.html", data); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func (v *View) RenderMini(data any) ([]byte, error) {
	var buf bytes.Buffer
	if err := v.mini.ExecuteTemplate(&buf, "miniapp.html", data); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func (v *View) RenderLogin(data any) ([]byte, error) {
	var buf bytes.Buffer
	if err := v.login.ExecuteTemplate(&buf, "login.html", data); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}

func (v *View) StaticFS() (fs.FS, error) { return fs.Sub(embedded, "static") }

func timeAgo(ts int64, loc *time.Location) string {
	if ts <= 0 {
		return "—"
	}
	d := time.Since(time.Unix(ts, 0))
	switch {
	case d < time.Minute:
		return "刚刚"
	case d < time.Hour:
		return fmt.Sprintf("%d 分钟前", int(d.Minutes()))
	case d < 24*time.Hour:
		return fmt.Sprintf("%d 小时前", int(d.Hours()))
	case d < 7*24*time.Hour:
		return fmt.Sprintf("%d 天前", int(d.Hours()/24))
	default:
		return time.Unix(ts, 0).In(loc).Format("01-02")
	}
}

func timeUntil(ts int64, loc *time.Location) string {
	if ts <= 0 {
		return "—"
	}
	d := time.Until(time.Unix(ts, 0))
	if d <= 0 {
		return "即将执行"
	}
	switch {
	case d < time.Minute:
		return "不到 1 分钟"
	case d < time.Hour:
		return fmt.Sprintf("%d 分钟后", int(d.Minutes())+1)
	case d < 24*time.Hour:
		return fmt.Sprintf("%d 小时后", int(d.Hours())+1)
	default:
		return fmt.Sprintf("%d 天后", int(d.Hours()/24)+1)
	}
}

var htmlTagRE = regexp.MustCompile(`<[^>]*>`)

func plainText(s string) string {
	s = htmlTagRE.ReplaceAllString(s, " ")
	s = html.UnescapeString(s)
	return strings.Join(strings.Fields(s), " ")
}

func initials(s string) string {
	r := []rune(strings.TrimSpace(s))
	if len(r) == 0 {
		return "✦"
	}
	if len(r) <= 2 {
		return string(r)
	}
	// Chinese titles look best with the first two characters.
	if r[0] > 127 {
		return string(r[:2])
	}
	words := strings.Fields(s)
	if len(words) >= 2 {
		return strings.ToUpper(string([]rune(words[0])[0:1]) + string([]rune(words[1])[0:1]))
	}
	return strings.ToUpper(string(r[:2]))
}

func avatarClass(s string) string {
	sum := 0
	for _, r := range s {
		sum += int(r)
	}
	classes := []string{"av-violet", "av-cyan", "av-amber", "av-rose", "av-emerald", "av-blue"}
	return classes[sum%len(classes)]
}

func formatNum(n int) string {
	s := fmt.Sprintf("%d", n)
	neg := strings.HasPrefix(s, "-")
	if neg {
		s = s[1:]
	}
	parts := []string{}
	for len(s) > 3 {
		parts = append([]string{s[len(s)-3:]}, parts...)
		s = s[:len(s)-3]
	}
	parts = append([]string{s}, parts...)
	out := strings.Join(parts, ",")
	if neg {
		out = "-" + out
	}
	return out
}

func sceneLabel(s string) string {
	switch s {
	case "welcome":
		return "进群欢迎"
	case "verify":
		return "入群验证"
	case "verify_success":
		return "验证通过"
	case "checkin":
		return "签到成功"
	case "redpacket":
		return "红包卡片"
	case "campaign":
		return "活动召集"
	case "rules":
		return "群规卡片"
	case "ad":
		return "广告文案"
	case "shop":
		return "积分商城"
	case "tasks":
		return "任务中心"
	case "store":
		return "数字商品"
	case "ticket":
		return "工单确认"
	case "help":
		return "帮助菜单"
	default:
		return s
	}
}

func statusLabel(s string) string {
	switch s {
	case "active", "published":
		return "进行中"
	case "paused":
		return "已暂停"
	case "draft":
		return "草稿"
	case "done", "finished":
		return "已完成"
	case "expired":
		return "已过期"
	case "drawing":
		return "开奖中"
	default:
		return s
	}
}

func modeLabel(m string) string {
	switch m {
	case "once":
		return "单次发送"
	case "daily":
		return "每天"
	case "weekly":
		return "每周"
	case "interval":
		return "固定间隔"
	case "cron":
		return "Cron 表达式"
	default:
		return m
	}
}

func actionLabel(a string) string {
	switch a {
	case "delete":
		return "删除"
	case "warn":
		return "警告"
	case "mute":
		return "禁言"
	case "kick":
		return "移出"
	case "ban":
		return "封禁"
	default:
		return a
	}
}

func roleLabel(role string) string {
	switch role {
	case "owner":
		return "Owner"
	case "admin":
		return "Admin"
	case "operator":
		return "Operator"
	case "viewer":
		return "Viewer"
	default:
		return role
	}
}

func fmtBytes(n int64) string {
	switch {
	case n >= 1<<30:
		return fmt.Sprintf("%.1f GB", float64(n)/(1<<30))
	case n >= 1<<20:
		return fmt.Sprintf("%.1f MB", float64(n)/(1<<20))
	case n >= 1<<10:
		return fmt.Sprintf("%.1f KB", float64(n)/(1<<10))
	default:
		return fmt.Sprintf("%d B", n)
	}
}

func auditLabel(a string) string {
	switch a {
	case "auth.login":
		return "登录"
	case "auth.logout":
		return "退出"
	case "group.create":
		return "接入群组"
	case "group.update":
		return "更新群组"
	case "group.settings":
		return "群配置"
	case "group.sync":
		return "同步群组"
	case "group.delete":
		return "移除群组"
	case "template.create":
		return "新建模板"
	case "template.update":
		return "更新模板"
	case "template.delete":
		return "删除模板"
	case "template.duplicate":
		return "复制模板"
	case "template.restore":
		return "恢复版本"
	case "schedule.create":
		return "新建任务"
	case "schedule.update":
		return "更新任务"
	case "schedule.delete":
		return "删除任务"
	case "schedule.run":
		return "立即发送"
	case "schedule.pause":
		return "暂停任务"
	case "schedule.resume":
		return "启用任务"
	case "points.adjust":
		return "调整积分"
	case "redpacket.create", "redpacket.send", "redpacket.delete", "redpacket.status":
		return "红包操作"
	case "campaign.create", "campaign.update", "campaign.delete", "campaign.publish", "campaign.draw":
		return "活动操作"
	case "ad.create", "ad.update", "ad.delete", "ad.send", "ad.pause", "ad.activate":
		return "广告操作"
	case "bot.connect":
		return "连接机器人"
	case "bot.disconnect":
		return "断开机器人"
	case "bot.refresh":
		return "刷新机器人"
	case "blacklist.add":
		return "加入黑名单"
	case "blacklist.delete":
		return "移出黑名单"
	case "security.update":
		return "安全设置"
	case "security.unlock":
		return "解除防护"
	case "security.raid":
		return "防炸群触发"
	case "blacklist.toggle":
		return "黑名单状态"
	case "shop.item", "shop.order":
		return "商城操作"
	case "task.create", "task.update", "task.delete":
		return "任务配置"
	case "star.product":
		return "数字商品"
	case "star.codes.add", "star.codes.delete":
		return "卡密池"
	case "ai.settings":
		return "AI 设置"
	case "ai.summary":
		return "AI 总结"
	case "ticket.reply":
		return "回复工单"
	case "ticket.close":
		return "关闭工单"
	case "api.key.create", "api.key.delete", "api.key.toggle":
		return "API Key"
	case "webhook.create", "webhook.update", "webhook.delete":
		return "Webhook"
	case "backup.download":
		return "下载备份"
	case "backup.restore":
		return "恢复备份"
	case "bot.account.create", "bot.account.delete", "bot.account.reconnect":
		return "机器人账号"
	case "automation.create", "automation.update", "automation.delete", "automation.toggle":
		return "自动化"
	case "team.create", "team.update", "team.password", "team.delete":
		return "团队管理"
	case "report.generate", "reports.settings":
		return "周报告警"
	case "invite.settings":
		return "邀请设置"
	case "settings.update":
		return "系统设置"
	case "admin.password":
		return "修改密码"
	default:
		return a
	}
}

func auditTone(a string) string {
	switch {
	case strings.HasPrefix(a, "auth."):
		return "tag-cyan"
	case strings.Contains(a, "delete") || strings.Contains(a, "blacklist"):
		return "tag-rose"
	case strings.Contains(a, "create") || strings.Contains(a, "connect"):
		return "tag-emerald"
	case strings.Contains(a, "update") || strings.Contains(a, "settings"):
		return "tag-violet"
	default:
		return "tag-muted"
	}
}

func kindLabel(k string) string {
	switch k {
	case "join":
		return "新成员"
	case "verify":
		return "验证通过"
	case "checkin":
		return "签到"
	case "redpacket":
		return "红包"
	case "campaign":
		return "活动"
	case "antispam":
		return "广告拦截"
	case "schedule":
		return "定时消息"
	case "ad":
		return "广告投放"
	case "leave":
		return "成员离开"
	case "verify_expired":
		return "验证超时"
	case "security":
		return "安全防护"
	case "shop":
		return "商城兑换"
	case "task":
		return "任务奖励"
	case "star":
		return "Stars 订单"
	case "ai":
		return "AI 总结"
	case "ticket":
		return "工单"
	default:
		return k
	}
}
