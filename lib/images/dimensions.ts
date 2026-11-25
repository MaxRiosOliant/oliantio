import fs from "node:fs"
import path from "node:path"

const cache = new Map<string, { width: number; height: number }>()

// Intrinsic size of a file in /public, so next/image can reserve the box.
export function publicImageSize(src: string) {
  const cached = cache.get(src)
  if (cached) {
    return cached
  }

  if (!src.startsWith("/")) {
    throw new Error(`Image src must be a public path, received "${src}"`)
  }

  const file = path.join(process.cwd(), "public", src)
  const size = readSize(fs.readFileSync(file))
  if (!size) {
    throw new Error(`Could not read dimensions for "${src}"`)
  }

  cache.set(src, size)
  return size
}

function readSize(buf: Buffer) {
  if (buf[0] === 0x89 && buf.toString("ascii", 1, 4) === "PNG") {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  }

  if (buf[0] === 0xff && buf[1] === 0xd8) {
    return jpegSize(buf)
  }

  if (buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    return webpSize(buf)
  }

  const ispe = buf.indexOf("ispe")
  if (ispe !== -1 && ispe + 16 <= buf.length) {
    return { width: buf.readUInt32BE(ispe + 8), height: buf.readUInt32BE(ispe + 12) }
  }

  return null
}

function jpegSize(buf: Buffer) {
  let offset = 2
  while (offset + 9 < buf.length) {
    if (buf[offset] !== 0xff) {
      offset += 1
      continue
    }

    const marker = buf[offset + 1]
    const isStartOfFrame =
      marker !== undefined &&
      marker >= 0xc0 &&
      marker <= 0xcf &&
      marker !== 0xc4 &&
      marker !== 0xc8 &&
      marker !== 0xcc

    if (isStartOfFrame) {
      return { width: buf.readUInt16BE(offset + 7), height: buf.readUInt16BE(offset + 5) }
    }

    const length = buf.readUInt16BE(offset + 2)
    offset += 2 + length
  }

  return null
}

function webpSize(buf: Buffer) {
  if (buf.toString("ascii", 12, 16) !== "VP8 ") {
    return null
  }

  const frame = 20
  if (buf[frame + 3] !== 0x9d || buf[frame + 4] !== 0x01 || buf[frame + 5] !== 0x2a) {
    return null
  }

  return {
    width: buf.readUInt16LE(frame + 6) & 0x3fff,
    height: buf.readUInt16LE(frame + 8) & 0x3fff,
  }
}
