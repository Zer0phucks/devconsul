# Platform Connection UI - Visual Component Guide

## ConnectionStatus Component

### State 1: Not Connected
```
┌─────────────────────────────────────────┐
│ ○ Not Connected    [Connect to Twitter] │
└─────────────────────────────────────────┘
  Gray badge          Blue button
```

### State 2: Connected
```
┌──────────────────────────────────────────────────────┐
│ ✓ Connected  ● Active 2 hours ago   [Disconnect]    │
│ ┌────────────────────────────────────────────────┐   │
│ │ Account Information                            │   │
│ │ Username: @yourusername                        │   │
│ │ Email: you@example.com                         │   │
│ │ Profile: View Profile ↗                        │   │
│ └────────────────────────────────────────────────┘   │
│ 🕐 Last synced 2 hours ago                          │
└──────────────────────────────────────────────────────┘
  Green badge   Green/yellow/red health dot
```

### State 3: Error
```
┌─────────────────────────────────────────────────────┐
│ ⚠ Connection Error  [Reconnect] [Disconnect]       │
│ ┌───────────────────────────────────────────────┐   │
│ │ ⚠ Token expired. Please reconnect to continue │   │
│ └───────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
  Red badge           Error alert box
```

## ApiKeyForm Component

```
┌──────────────────────────────────────────────┐
│ Admin API Key                                │
│ ┌────────────────────────────────┐ 👁 📋    │
│ │ •••••••••••••••••••••••••••••  │           │
│ └────────────────────────────────┘           │
│                                              │
│ Site URL                                     │
│ ┌────────────────────────────────────────┐  │
│ │ https://yourblog.ghost.io             │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ Author Name                                  │
│ ┌────────────────────────────────────────┐  │
│ │ Your Name                              │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ ┌────────────────────────────────────────┐  │
│ │ ℹ Your API key will be encrypted and   │  │
│ │   stored securely                      │  │
│ └────────────────────────────────────────┘  │
│                                              │
│ [Test Connection]  [Save & Connect]         │
└──────────────────────────────────────────────┘
   Outline button    Primary button
```

## OAuthConnectModal Component

```
┌──────────────────────────────────────────┐
│ 🐦 Connect to Twitter/X            ✕    │
│ Post updates and threads to Twitter      │
├──────────────────────────────────────────┤
│                                          │
│ 🛡 Your credentials are encrypted and    │
│    never shared                          │
│                                          │
│ What happens next:                       │
│ 1. You'll be redirected to Twitter/X     │
│ 2. Grant permissions to post updates     │
│ 3. You'll be redirected back             │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ ↗ Connect to Twitter/X              │ │
│ └──────────────────────────────────────┘ │
│    Platform-branded color button         │
│                                          │
│ ┌──────────────────────────────────────┐ │
│ │ Cancel                               │ │
│ └──────────────────────────────────────┘ │
└──────────────────────────────────────────┘
```

## CharacterCounter Component

### Normal (< 80%)
```
285 / 280                     5 remaining
████████████████░░░░░░░░░░░░░░░░░░ 95%
```

### Warning (80-100%)
```
275 / 280                     5 remaining
██████████████████████████░░░░ 98%
(Yellow progress bar)
⚠ Approaching Twitter character limit
```

### Error (> 100%)
```
285 / 280        ⚠ 5 over limit
███████████████████████████████ 101%
(Red progress bar)
⚠ Content exceeds Twitter character limit
```

## ImageGenerationToggle Component

```
┌────────────────────────────────────────┐
│ ✨ AI Image Generation        [ON/OFF] │
│ Automatically generate featured images  │
├────────────────────────────────────────┤
│ Image Style                            │
│ [Photorealistic ▼]                     │
│                                        │
│ Aspect Ratio                           │
│ [16:9 (Landscape) ▼]                   │
│                                        │
│ AI Provider                            │
│ [DALL-E 3 (Fast, $0.04/image) ▼]      │
│                                        │
│ 💲 Estimated cost: $0.04 per image     │
│                                        │
│ Style Examples                         │
│ ┌─────┐ ┌─────┐ ┌─────┐              │
│ │Photo│ │Illus│ │Abst │              │
│ └─────┘ └─────┘ └─────┘              │
└────────────────────────────────────────┘
```

## PlatformSettings Component

### Collapsed
```
┌────────────────────────────────────┐
│ Platform Settings             ⌄   │
└────────────────────────────────────┘
```

### Expanded (Twitter Example)
```
┌────────────────────────────────────┐
│ Platform Settings             ⌃   │
├────────────────────────────────────┤
│ Include Hashtags          [ON/OFF] │
│                                    │
│ Hashtags (comma-separated)         │
│ ┌────────────────────────────────┐ │
│ │ #tech, #innovation, #ai        │ │
│ └────────────────────────────────┘ │
│                                    │
│ [💾 Save Settings]                │
└────────────────────────────────────┘
```

## PlatformCard Component

```
┌─────────────────────────────────────────────────────┐
│ 📝  WordPress                        [Blog]         │
│     Publish blog posts to your WordPress site       │
│                                                     │
│ ✓ Connected  ● Active 2h ago      [Disconnect]     │
│ ┌─────────────────────────────────────────────┐    │
│ │ Account Information                         │    │
│ │ Email: you@example.com                      │    │
│ └─────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────┤
│ 📤 Posts Published     🔥 Last Activity             │
│    42                     2 hours ago               │
├─────────────────────────────────────────────────────┤
│ Platform Settings                           ⌄       │
└─────────────────────────────────────────────────────┘
  Expandable settings (collapsed by default)
```

## Platforms Dashboard Layout

```
┌───────────────────────────────────────────────────┐
│ Platform Connections      [Add Platform ▼]        │
│ Connect and manage your publishing platforms      │
└───────────────────────────────────────────────────┘

Blog Platforms
┌──────────────────────┐  ┌──────────────────────┐
│ WordPress            │  │ Ghost                │
│ ✓ Connected          │  │ ○ Not Connected      │
│ 42 posts             │  │ [Connect]            │
└──────────────────────┘  └──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│ Medium               │  │ Webhook              │
│ ○ Not Connected      │  │ ✓ Connected          │
│ [Connect]            │  │ 15 posts             │
└──────────────────────┘  └──────────────────────┘

─────────────────────────────────────────────────────

Social Media
┌──────────────────────┐  ┌──────────────────────┐
│ Twitter/X            │  │ LinkedIn             │
│ ✓ Connected          │  │ ○ Not Connected      │
│ 128 posts            │  │ [Connect]            │
└──────────────────────┘  └──────────────────────┘

┌──────────────────────┐  ┌──────────────────────┐
│ Facebook             │  │ Reddit               │
│ ⚠ Connection Error   │  │ ✓ Connected          │
│ [Reconnect]          │  │ 8 posts              │
└──────────────────────┘  └──────────────────────┘

─────────────────────────────────────────────────────

Email Services
┌──────────────────────┐  ┌──────────────────────┐
│ Resend               │  │ SendGrid             │
│ ✓ Connected          │  │ ○ Not Connected      │
│ 1,250 emails         │  │ [Connect]            │
└──────────────────────┘  └──────────────────────┘

┌──────────────────────┐
│ Mailchimp            │
│ ○ Not Connected      │
│ [Connect]            │
└──────────────────────┘
```

## OAuth Callback Page

### Loading State
```
┌───────────────────────────────┐
│          🐦                   │
│          (spinning)           │
│                               │
│      Connecting...            │
│                               │
│  Completing your Twitter      │
│  connection                   │
└───────────────────────────────┘
```

### Success State
```
┌───────────────────────────────┐
│          🐦                   │
│          ✓                    │
│                               │
│  Connection Successful!       │
│                               │
│  ┌─────────────────────────┐  │
│  │ ✓ Successfully connected│  │
│  │   to Twitter/X          │  │
│  └─────────────────────────┘  │
│                               │
│  Redirecting you to           │
│  platforms dashboard...       │
└───────────────────────────────┘
```

### Error State
```
┌───────────────────────────────┐
│          🐦                   │
│          ✕                    │
│                               │
│  Connection Failed            │
│                               │
│  ┌─────────────────────────┐  │
│  │ ✕ Token exchange failed │  │
│  │   Please try again      │  │
│  └─────────────────────────┘  │
│                               │
│  [Back to Platforms]          │
│  [Try Again]                  │
└───────────────────────────────┘
```

## Mobile Layout (< 768px)

Platforms stack vertically in single column:

```
┌─────────────────────┐
│ WordPress           │
│ ✓ Connected         │
│ 42 posts            │
└─────────────────────┘

┌─────────────────────┐
│ Ghost               │
│ ○ Not Connected     │
│ [Connect]           │
└─────────────────────┘

┌─────────────────────┐
│ Medium              │
│ ○ Not Connected     │
│ [Connect]           │
└─────────────────────┘
```

## Color Coding Guide

**Status Badges:**
- Green (#22c55e): Connected, healthy
- Yellow (#eab308): Warning, approaching limits
- Red (#ef4444): Error, over limits, disconnected
- Gray (#6b7280): Not connected, neutral state

**Progress Bars:**
- Green: < 80% of character limit
- Yellow: 80-100% of character limit
- Red: > 100% of character limit

**Platform Brand Colors:**
- Twitter: #1DA1F2
- LinkedIn: #0A66C2
- Facebook: #1877F2
- Reddit: #FF4500
- Ghost: #15171A
- WordPress: #21759b
- Mailchimp: #FFE01B
- SendGrid: #1A82E2

## Icon Legend

- 📝 WordPress
- 👻 Ghost
- 📖 Medium
- 🐦 Twitter/X
- 💼 LinkedIn
- 👥 Facebook
- 🔴 Reddit
- 📧 Resend
- ✉️ SendGrid
- 🐵 Mailchimp
- 🔗 Webhook
- ✓ Connected/Success
- ○ Not connected
- ⚠ Warning/Error
- ✕ Disconnected/Failed
- ↗ External link
- 👁 Show/hide
- 📋 Copy
- 💾 Save
- ⌄ Expand
- ⌃ Collapse
- 🛡 Security
- 💲 Cost
- ✨ AI/Magic
