# XiaowenAgent

用于生成微信公众号文章与视频号图文内容的智能体服务。

## 功能

- 输入一次业务信息，同时生成公众号长文与视频号图文
- 输出标题备选、结构大纲、正文、封面文案与标签
- 基于真实大模型 API 调用，可直接接入业务系统

## 快速开始

```bash
npm install
cp .env.example .env
npm run dev
```

## 环境变量

- OPENAI_API_KEY：模型服务密钥
- OPENAI_BASE_URL：模型服务地址，兼容 OpenAI 协议
- OPENAI_MODEL：模型名称
- PORT：服务端口

## 接口

- `GET /health`
- `POST /api/generate`

请求体示例：

```json
{
  "topic": "私域成交率提升",
  "audience": "中小电商品牌主理人",
  "goal": "获取试用咨询",
  "highlights": [
    "搭建7天跟进节奏",
    "朋友圈内容分层",
    "复购召回脚本"
  ],
  "tone": "干货",
  "wordCount": 1800,
  "callToAction": "评论区回复「模板」领取执行清单"
}
```

调用示例：

```bash
curl -X POST http://localhost:3000/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic":"私域成交率提升",
    "audience":"中小电商品牌主理人",
    "goal":"获取试用咨询",
    "highlights":["搭建7天跟进节奏","朋友圈内容分层","复购召回脚本"],
    "tone":"干货",
    "wordCount":1800,
    "callToAction":"评论区回复「模板」领取执行清单"
  }'
```
