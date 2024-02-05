import { Context, Schema } from "koishi"
import { chatToXdPUA } from "xdi8-transcriber"
import { stripTags } from "./utils"

export const name = "xegoe"
export const using = ["puppeteer"] as const

export interface Config {
  src: string
  maxWidth: string
  padding: string
}

export const Config: Schema<Config> = Schema.object({
  src: Schema.string()
    .description("字体源")
    .default(
      `url("https://dgck81lnn.github.io/bootstrap-lnn/fonts/XEGOEPUAall.woff2") format("woff2")`
    )
    .role("textarea"),
  maxWidth: Schema.string().description("文本区域的最大宽度").default("15rem"),
  padding: Schema.string().description("文本区域的边距").default("0.25rem"),
})

export function apply(ctx: Context, config: Config) {
  ctx.i18n.define("zh", require("./locales/zh"))

  ctx
    .command("xdi8/xegoe <text:text>", {
      checkArgCount: true,
      checkUnknown: true,
      showWarning: true,
    })
    .action(({ session }, text) => {
      text = stripTags(text)

      const pua = chatToXdPUA(text)
      if (!pua.match(/[\ue000-\uf7ff\u21E7\u21E9]/))
        return session.text(".no-shidinn-letter")
      return (
        <html>
          <style>{
            /*css*/ `
            @font-face {
              font-family: "-xdi8-font";
              src: ${config.src};
              font-display: block;
            }`
          }</style>
          <div
            lang="qdx"
            style={{
              maxWidth: config.maxWidth,
              padding: config.padding,
              fontFamily: "-xdi8-font",
              whiteSpace: "pre-wrap",
              overflowWrap: "break-word",
            }}
          >
            {pua}
          </div>
        </html>
      )
    })
}
