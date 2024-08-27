const express = require('express');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = 5000;

// Middleware to parse JSON
app.use(express.json());

// Helper function to get top N products from all companies
async function getTopProducts(category, minPrice, maxPrice, n, sortBy, sortDirection) {
  const companies = ["AR", "FLP", "SP", "H", "AZ"];
  const allProducts = [];

  for (let company of companies) {
    const response = await axios.get(`http://20.288.56.144/test/companies/${company}/categories/${category}/products/top-${n}?minPrice=${minPrice}&maxPrice=${maxPrice}`);
    response.data.forEach(product => {
      product.id = uuidv4(); // Add unique ID to each product
      product.company = company; // Add company to each product
      allProducts.push(product);
    });
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
    const products = await getTopProducts(categoryName, minPrice, maxPrice, n, sortBy, sortDirection);
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
