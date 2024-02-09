import { Context, Schema } from "koishi"
import {
  Alternation,
  HanziToXdi8Transcriber,
  TranscribeResult,
  Xdi8ToHanziTranscriber,
  chatToXdPUA,
} from "xdi8-transcriber"
import { tryRestoreRawText, stripTags } from "./utils"

export const name = "xegoe"
export const using = ["puppeteer"] as const

export interface Config {
  src: string
  fontSize: number
  fallbackFontFamily: string
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
  fontSize: Schema.number().description("字号，单位 px").default(16),
  fallbackFontFamily: Schema.string()
    .description("备选字体")
    .default("Segoe UI, Source Han Sans SC"),
  maxWidth: Schema.string().description("文本区域的最大宽度").default("15em"),
  padding: Schema.string().description("文本区域的边距").default("0.25em"),
})

let hxTranscriber: HanziToXdi8Transcriber
let xhTranscriber: Xdi8ToHanziTranscriber

function hxTranscribe(text: string) {
  hxTranscriber ||= new HanziToXdi8Transcriber()
  return hxTranscriber.transcribe(text, { ziSeparator: "" })
}

function xhTranscribe(text: string) {
  xhTranscriber ||= new Xdi8ToHanziTranscriber()
  return xhTranscriber.transcribe(text, { ziSeparator: " " })
}

function ruby(chars: { h: string; x: string }[], className?: string) {
  const ruby = <ruby>{chars.flatMap(({ h, x }) => [h, <rt>{chatToXdPUA(x)}</rt>])}</ruby>
  if (className) return <div class={className}>{ruby}</div>
  return ruby
}

function formatResult<T extends "h" | "x">(
  result: TranscribeResult,
  sourceType: T,
  { all = false }
) {
  if (result.length === 1 && typeof result[0] === "string") {
    if (sourceType === "h") {
      const text = chatToXdPUA(result[0])
      if (text.match(/[\ue000-\uf7ff\u21E7\u21E9]/)) return [text]
    }
    result.length = 0
  }
  if (!result.length) return

  const single = result.length === 1 && Array.isArray(result[0])

  const alts: (Alternation[] & { $: string })[] = []
  const body = result.flatMap(seg => {
    if (typeof seg === "string") return [chatToXdPUA(seg)]
    if (Array.isArray(seg)) {
      const legacyOnly = seg.slice(1).every(alt => alt.legacy)
      let className = "selectable"
      if (legacyOnly) className += " selectable-legacyonly"
      const els = [ruby(seg[0].content, className)]

      if (all || (sourceType === "h" && !legacyOnly)) {
        const j = JSON.stringify(seg)
        let index = alts.findIndex(s => s.$ === j)
        if (index === -1) {
          index = alts.length
          alts.push(Object.assign(seg, { $: j }))
        }
        els.push(<sup>[{index + 1}]</sup>)
      }
      return els
    }
    return [ruby([seg])]
  })

  const footnotes = alts.map(seg => {
    console.dir(seg)
    return (
      <li>
        {seg[0].content.map(seg => seg[sourceType]).join("")}:
        <ul class="alternations">
          {seg.map(alt => (
            <li class={`alternation ${alt.legacy ? "alternation-legacy" : ""}`}>
              {ruby(alt.content)} <span class="note">{alt.note}</span>
            </li>
          ))}
        </ul>
      </li>
    )
  })

  if (single && footnotes.length === 1)
    return [<div class="footnotes footnotes-only">{footnotes[0].children.slice(-1)}</div>]
  if (footnotes.length) return [body, <ol class="footnotes">{footnotes}</ol>]
  return [body]
}

export function apply(ctx: Context, config: Config) {
  ctx.i18n.define("zh", require("./locales/zh"))

  const logger = ctx.logger("xegoe")
  logger.level = 3

  ctx
    .command("xegoe <text:text>", {
      checkArgCount: true,
      checkUnknown: true,
      showWarning: true,
    })
    .option("all", "-a")
    .option("x2h", "-x")
    .action(({ options: { all, x2h }, session, source }, text) => {
      if (source) text = stripTags(tryRestoreRawText(text, source) || text)

      const result = (x2h ? xhTranscribe : hxTranscribe)(text)
      const visual = formatResult(result, x2h ? "x" : "h", { all })
      if (!visual)
        return session.text(x2h ? ".no-shidinn-word" : ".no-shidinn-letter-or-hanzi")

      return (
        <html>
          <style>{
            /*css*/ `
            @font-face {
              font-family: "-xdi8-font";
              src: ${config.src};
              font-display: block;
            }
            sup {
              font-size: 0.5em;
              color: #048;
            }
            .selectable {
              background-color: #fec;
              display: inline-block;
            }
            .selectable-legacyonly {
              background-color: #eee;
            }
            .note { font-size: 0.75em }
            .footnotes {
              font-size: 0.8em;
              margin: 0;
              padding-left: 1.5em;
            }
            .alternations {
              margin: 0;
              padding-left: 0.5em;
            }
            .alternation-legacy {
              color: #777;
            }
            .footnotes-only ruby {
              font-size: 1.333333em;
            }`
          }</style>
          <div
            lang="qdx"
            style={{
              maxWidth: config.maxWidth,
              padding: config.padding,
              fontSize: `${config.fontSize}px`,
              fontFamily:
                "-xdi8-font" +
                (config.fallbackFontFamily ? ", " + config.fallbackFontFamily : ""),
              whiteSpace: "pre-wrap",
              overflowWrap: "break-word",
            }}
          >
            {visual}
          </div>
        </html>
      )
    })
}
