import sqlite3 from 'sqlite3'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 确保uploads目录存在
const uploadsDir = path.join(__dirname, '../uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// 数据库文件路径
const dbPath = path.join(__dirname, 'clipboard.db')

export function getDB() {
  return new sqlite3.Database(dbPath)
}

export async function initDatabase() {
  return new Promise((resolve, reject) => {
    const db = getDB()
    
    // 创建用户表
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        reject(err)
        return
      }
      
      // 创建文字剪贴板表
      db.run(`
        CREATE TABLE IF NOT EXISTS text_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          reject(err)
          return
        }
        
        // 创建图片剪贴板表
        db.run(`
          CREATE TABLE IF NOT EXISTS image_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            original_name TEXT NOT NULL,
            size INTEGER NOT NULL,
            mime_type TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
          )
        `, (err) => {
          if (err) {
            reject(err)
            return
          }
          
          // 创建文件剪贴板表
          db.run(`
            CREATE TABLE IF NOT EXISTS file_items (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL,
              filename TEXT NOT NULL,
              original_name TEXT NOT NULL,
              size INTEGER NOT NULL,
              mime_type TEXT NOT NULL,
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (user_id) REFERENCES users (id)
            )
          `, (err) => {
            if (err) {
              reject(err)
              return
            }
            
            console.log('数据库初始化完成')
            resolve()
          })
        })
      })
    })
  })
}