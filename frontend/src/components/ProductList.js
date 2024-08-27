import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('Laptop'); // Default category
  const [n, setN] = useState(10); // Default number of products

  useEffect(() => {
    const fetchProducts = async () => {
      const response = await axios.get(`/categories/${category}/products?n=${n}`);
      setProducts(response.data);
    };
    fetchProducts();
  }, [category, n]);

  return (
    <div>
      <h1>Top Products</h1>
      <ul>
        {products.map(product => (
          <li key={product.id}>
            <Link to={`/categories/${category}/products/${product.id}`}>
              {product.productName} - ${product.price}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ProductList;
