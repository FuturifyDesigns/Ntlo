// Lazy-loaded OCR wrapper around tesseract.js so the ~heavy worker/wasm is only
// fetched when an admin actually runs a compliance scan.

let workerPromise = null

async function getWorker(onProgress) {
  const { createWorker } = await import('tesseract.js')
  if (!workerPromise) {
    workerPromise = createWorker('eng', undefined, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) onProgress(m.progress)
      },
    })
  }
  return workerPromise
}

/**
 * Run OCR on an image URL.
 * @returns {Promise<{ text: string, confidence: number }>}
 */
export async function recognizeImage(url, onProgress) {
  const worker = await getWorker(onProgress)
  const { data } = await worker.recognize(url)
  return {
    text: data.text || '',
    confidence: typeof data.confidence === 'number' ? data.confidence : 0,
  }
}

export async function terminateOcr() {
  if (workerPromise) {
    const worker = await workerPromise
    await worker.terminate()
    workerPromise = null
  }
}
