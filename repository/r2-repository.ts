export const list = async (bucket: R2Bucket, options?: { prefix?: string; limit?: number; cursor?: string }) => await bucket.list(options)

export const upload = async (
    bucket: R2Bucket,
    key: string,
    value: ReadableStream | ArrayBuffer | ArrayBufferView | string | Blob,
    options?: R2PutOptions,
) => await bucket.put(key, value, options)

export const removeById = async (bucket: R2Bucket, key: string) => await bucket.delete(key)
