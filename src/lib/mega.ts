import { Storage } from 'megajs'

class MegaStorage {
  private storage: Storage | null = null
  private initialized = false

  async initialize() {
    if (this.initialized) return this.storage

    try {
      this.storage = await new Storage({
        email: process.env.MEGA_EMAIL!,
        password: process.env.MEGA_PASSWORD!
      }).ready

      this.initialized = true
      return this.storage
    } catch (error) {
      console.error('Failed to initialize Mega storage:', error)
      throw error
    }
  }

  async uploadFile(fileName: string, fileBuffer: Buffer) {
    const storage = await this.initialize()
    if (!storage) throw new Error('Storage not initialized')

    try {
      const file = await storage.upload(fileName, fileBuffer).complete
      return {
        success: true,
        fileId: file.nodeId,
        fileName: file.name,
        size: file.size,
        downloadUrl: file.link ? file.link({ noKey: false }) : '#'
      }
    } catch (error) {
      console.error('Failed to upload file:', error)
      throw error
    }
  }

  async deleteFile(fileId: string) {
    const storage = await this.initialize()
    if (!storage) throw new Error('Storage not initialized')

    try {
      const file = storage.files[fileId]
      if (file) {
        await file.delete()
        return { success: true }
      }
      return { success: false, error: 'File not found' }
    } catch (error) {
      console.error('Failed to delete file:', error)
      throw error
    }
  }

  async listFiles() {
    const storage = await this.initialize()
    if (!storage) throw new Error('Storage not initialized')

    try {
      const files = Object.values(storage.files).map((file) => ({
        id: file.nodeId,
        name: file.name,
        size: file.size,
        createdAt: new Date((file.timestamp || 0) * 1000),
        downloadUrl: file.link ? file.link({ noKey: false }) : '#'
      }))
      return files
    } catch (error) {
      console.error('Failed to list files:', error)
      throw error
    }
  }
}

export const megaStorage = new MegaStorage()