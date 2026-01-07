import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module 中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../.env') });

// 导入模型和种子数据
import District from '../models/District.js';
import districtsData from '../seeds/districts.js';

// 数据库连接 URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/old-hong-kong-memory';

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.cyan}ℹ️  ${msg}${colors.reset}`),
  warn: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
};

/**
 * 种子数据库
 */
const seedDatabase = async () => {
  try {
    // 连接数据库
    log.info(`Connecting to MongoDB: ${MONGODB_URI}`);
    await mongoose.connect(MONGODB_URI);
    log.success('MongoDB connected successfully');

    // =====================
    // Seed Districts
    // =====================
    log.info('Seeding districts...');

    // 清除现有数据
    const deleteResult = await District.deleteMany({});
    log.warn(`Cleared ${deleteResult.deletedCount} existing districts`);

    // 插入种子数据
    const insertedDistricts = await District.insertMany(districtsData);
    log.success(`Inserted ${insertedDistricts.length} districts`);

    // 按区域统计
    const regionStats = {
      hk_island: insertedDistricts.filter((d) => d.region === 'hk_island').length,
      kowloon: insertedDistricts.filter((d) => d.region === 'kowloon').length,
      new_territories: insertedDistricts.filter((d) => d.region === 'new_territories').length,
    };

    console.log('\n📊 District Statistics:');
    console.log(`   Hong Kong Island: ${regionStats.hk_island}`);
    console.log(`   Kowloon: ${regionStats.kowloon}`);
    console.log(`   New Territories: ${regionStats.new_territories}`);
    console.log(`   Total: ${insertedDistricts.length}\n`);

    // 显示所有地区
    console.log('📍 Inserted Districts:');
    insertedDistricts.forEach((district) => {
      console.log(`   - ${district.code}: ${district.name} (${district.region})`);
    });

    log.success('\nDatabase seeding completed successfully!');
  } catch (error) {
    log.error(`Seeding failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // 断开连接
    await mongoose.disconnect();
    log.info('MongoDB disconnected');
    process.exit(0);
  }
};

// 执行种子脚本
seedDatabase();
