const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const NodeCache = require('node-cache');

const app = express();
const PORT = process.env.PORT || 5000;
const TEST_SERVER_URL = process.env.TEST_SERVER_URL || 'http://20.288.56.144/test';
const CACHE_TTL = 60 * 5; // Cache TTL of 5 minutes
const requestCache = new NodeCache({ stdTTL: CACHE_TTL });

// Middleware to parse JSON
app.use(express.json());

// Helper function to get top N products from all companies
async function getTopProducts(category, minPrice, maxPrice, n, sortBy, sortDirection) {
  const companies = ["AR", "FLP", "SP", "H", "AZ"];
  const allProducts = [];

  for (let company of companies) {
    // Cache key for this specific request
    const cacheKey = `${company}-${category}-${minPrice}-${maxPrice}-${n}`;
    
    // Check if data is in cache
    let cachedProducts = requestCache.get(cacheKey);
    if (!cachedProducts) {
      try {
        const response = await axios.get(`${TEST_SERVER_URL}/companies/${company}/categories/${category}/products/top-${n}?minPrice=${minPrice}&maxPrice=${maxPrice}`);
        cachedProducts = response.data.map(product => ({
          ...product,
          id: uuidv4(), // Add unique ID to each product
          company // Add company to each product
        }));

        // Store in cache
        requestCache.set(cacheKey, cachedProducts);
      } catch (error) {
        console.error(`Error fetching products for ${company}:`, error.message);
        continue;
      }
    }

    allProducts.push(...cachedProducts);
  }

  // Sort products if sortBy is provided
  if (sortBy) {
    allProducts.sort((a, b) => {
      if (sortDirection === 'asc') {
        return a[sortBy] > b[sortBy] ? 1 : -1;
      } else {
        return a[sortBy] < b[sortBy] ? 1 : -1;
      }
    });
  }

  return allProducts.slice(0, n);
}

// Route to get top N products in a category
app.get('/categories/:categoryName/products', async (req, res) => {
  const { categoryName } = req.params;
  const { minPrice = 0, maxPrice = Infinity, n = 10, sortBy, sortDirection = 'asc', page = 1 } = req.query;

  const productsPerPage = 10;
  const offset = (page - 1) * productsPerPage;

  try {
    // Calculate the total number of products to fetch based on pagination
    const totalProductsToFetch = Math.min(n, productsPerPage * page);
    const products = await getTopProducts(categoryName, minPrice, maxPrice, totalProductsToFetch, sortBy, sortDirection);

    // Paginate the products
    const paginatedProducts = products.slice(offset, offset + productsPerPage);
    res.json(paginatedProducts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error: error.message });
  }
});

// Route to get details of a specific product
app.get('/categories/:categoryName/products/:productId', async (req, res) => {
  const { categoryName, productId } = req.params;

  try {
    // Fetch more products to ensure the product ID exists in the dataset
    const products = await getTopProducts(categoryName, 0, Infinity, 100);
    const product = products.find(p => p.id === productId);

    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error fetching product details', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
