import { Extension, Mark, mergeAttributes } from "@tiptap/react"
import {
  fontFamilies,
  fontSizes,
  lineHeights,
  textAlignments,
} from "./richText"

// Small extensions on the existing free editor; all values share the public renderer's allowlist.
export const FontStyle = Mark.create({
  name: "textStyle",
  addAttributes() {
    return Object.fromEntries(
      ["fontSize", "fontFamily", "color", "backgroundColor"].map((key) => [
        key,
        {
          default: null,
          parseHTML: (element: HTMLElement) => {
            const value = element.style[
              key as "fontSize" | "fontFamily" | "color" | "backgroundColor"
            ].replace(/["']/g, "")
            if (key === "fontSize")
              return fontSizes.includes(value) ? value : null
            if (key === "fontFamily")
              return fontFamilies.includes(value) ? value : null
            const rgb = value.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/)
            return rgb
              ? "#" +
                  rgb
                    .slice(1)
                    .map((n) => Number(n).toString(16).padStart(2, "0"))
                    .join("")
              : /^#[0-9a-f]{6}$/i.test(value)
                ? value
                : null
          },
          renderHTML: (attributes: Record<string, string>) =>
            attributes[key]
              ? {
                  style: `${key.replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase())}: ${attributes[key]}`,
                }
              : {},
        },
      ]),
    )
  },
  parseHTML: () => [{ tag: "span[style]" }],
  renderHTML: ({ HTMLAttributes }) => [
    "span",
    mergeAttributes(HTMLAttributes),
    0,
  ],
})
export const ParagraphStyle = Extension.create({
  name: "paragraphStyle",
  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: Object.fromEntries(
          [
            ["textAlign", textAlignments],
            ["lineHeight", lineHeights],
          ].map(([key, choices]) => [
            key as string,
            {
              default: null,
              parseHTML: (element: HTMLElement) => {
                const value = element.style[key as "textAlign" | "lineHeight"]
                return (choices as string[]).includes(value) ? value : null
              },
              renderHTML: (attributes: Record<string, string>) =>
                attributes[key as string]
                  ? {
                      style: `${(key as string).replace(/[A-Z]/g, (letter) => "-" + letter.toLowerCase())}: ${attributes[key as string]}`,
                    }
                  : {},
            },
          ]),
        ),
      },
    ]
  },
})
