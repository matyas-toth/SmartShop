import sharp from "sharp"
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export class ImageInputError extends Error {}

export async function readImageBody(request: Request) {
  const reader = request.body?.getReader()
  if (!reader) throw new ImageInputError("Válassz képfájlt.")
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > MAX_IMAGE_BYTES) {
        await reader.cancel()
        throw new ImageInputError("A kép legfeljebb 5 MB lehet.")
      }
      chunks.push(value)
    }
  } finally {
    reader.releaseLock()
  }
  if (!length) throw new ImageInputError("A képfájl üres.")
  return Buffer.concat(chunks)
}

export async function prepareProductImage(bytes: Uint8Array) {
  if (bytes.byteLength > MAX_IMAGE_BYTES)
    throw new ImageInputError("A kép legfeljebb 5 MB lehet.")
  try {
    const image = sharp(bytes, {
      limitInputPixels: 20_000_000,
      failOn: "warning",
    })
    const metadata = await image.metadata()
    if (
      !["jpeg", "png", "webp"].includes(metadata.format ?? "") ||
      (metadata.pages ?? 1) > 1
    ) {
      throw new ImageInputError("JPG, PNG vagy nem animált WebP képet válassz.")
    }
    return await image
      .rotate()
      .resize({
        width: 1600,
        height: 1600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer()
  } catch (error) {
    if (error instanceof ImageInputError) throw error
    throw new ImageInputError(
      "A fájl nem érvényes vagy túl nagy felbontású kép."
    )
  }
}
