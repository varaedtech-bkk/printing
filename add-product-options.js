import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  user: process.env.DB_USER || "sunny",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "printing",
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function addProductOptions() {
  try {
    console.log("Adding product options to existing products...");

    // Get all products
    const productsResult = await pool.query('SELECT id, name_en FROM products');
    const products = productsResult.rows;

    console.log(`Found ${products.length} products`);

    for (const product of products) {
      console.log(`Adding options for: ${product.name_en}`);

      // Add quantity options
      const quantityOptions = [
        { name: '100', priceModifier: '0', isDefault: false },
        { name: '250', priceModifier: '0', isDefault: false },
        { name: '500', priceModifier: '0', isDefault: true },
        { name: '1000', priceModifier: '0', isDefault: false },
      ];

      for (const option of quantityOptions) {
        await pool.query(`
          INSERT INTO product_options (product_id, type, name_en, name_th, default_price_modifier, is_default)
          VALUES ($1, 'quantity', $2, $2, $3, $4)
          ON CONFLICT DO NOTHING
        `, [product.id, option.name, option.priceModifier, option.isDefault]);
      }

      // Add paper options
      const paperOptions = [
        { name: 'Standard Paper', priceModifier: '0', isDefault: true },
        { name: 'Premium Paper', priceModifier: '0.50', isDefault: false },
        { name: 'Glossy Paper', priceModifier: '1.00', isDefault: false },
      ];

      for (const option of paperOptions) {
        await pool.query(`
          INSERT INTO product_options (product_id, type, name_en, name_th, default_price_modifier, is_default)
          VALUES ($1, 'paper', $2, $2, $3, $4)
          ON CONFLICT DO NOTHING
        `, [product.id, option.name, option.priceModifier, option.isDefault]);
      }

      // Add finish options
      const finishOptions = [
        { name: 'Matte', priceModifier: '0', isDefault: true },
        { name: 'Gloss', priceModifier: '0.30', isDefault: false },
        { name: 'UV Coating', priceModifier: '1.50', isDefault: false },
      ];

      for (const option of finishOptions) {
        await pool.query(`
          INSERT INTO product_options (product_id, type, name_en, name_th, default_price_modifier, is_default)
          VALUES ($1, 'finish', $2, $2, $3, $4)
          ON CONFLICT DO NOTHING
        `, [product.id, option.name, option.priceModifier, option.isDefault]);
      }
    }

    console.log("✅ Product options added successfully!");
  } catch (error) {
    console.error("❌ Error adding product options:", error);
  } finally {
    await pool.end();
  }
}

addProductOptions();
