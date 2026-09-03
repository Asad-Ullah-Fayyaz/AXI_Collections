import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, ChevronRight, X } from 'lucide-react';
import ProductCard from '../components/product/ProductCard';
import api from '../services/api';

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters State
  const categoryParam = searchParams.get('category') || '';
  const subCategoryParam = searchParams.get('subCategory') || '';
  const searchParam = searchParams.get('search') || '';
  const sortParam = searchParams.get('sort') || 'newest';
  const pageParam = parseInt(searchParams.get('page') || '1', 10);
  const inStockParam = searchParams.get('inStock') === 'true';

  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        if (res.success) setCategories(res.categories);
      } catch (err) {
        console.error('Failed to load categories:', err.message);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (categoryParam) params.append('category', categoryParam);
        if (subCategoryParam) params.append('subCategory', subCategoryParam);
        if (searchParam) params.append('search', searchParam);
        if (sortParam) params.append('sort', sortParam);
        if (inStockParam) params.append('inStock', 'true');
        if (minPrice) params.append('minPrice', minPrice);
        if (maxPrice) params.append('maxPrice', maxPrice);
        params.append('page', pageParam.toString());
        params.append('limit', '12');

        const res = await api.get(`/products?${params.toString()}`);
        if (res.success) {
          setProducts(res.products);
          setTotalProducts(res.total);
          setTotalPages(res.pages);
        }
      } catch (err) {
        console.error('Failed to fetch catalog products:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset to page 1 on filter update
    setSearchParams(newParams);
  };

  const handlePriceApply = (e) => {
    e.preventDefault();
    const newParams = new URLSearchParams(searchParams);
    if (minPrice) newParams.set('minPrice', minPrice); else newParams.delete('minPrice');
    if (maxPrice) newParams.set('maxPrice', maxPrice); else newParams.delete('maxPrice');
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  const clearAllFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSearchParams(new URLSearchParams());
  };

  const activeCategoryObj = categories.find(c => c.slug === categoryParam);

  return (
    <div className="container" style={{ padding: '3rem 1.5rem' }}>
      {/* Breadcrumb & Header */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
          <span>Home</span> <ChevronRight size={12} />
          <span>Catalog</span>
          {activeCategoryObj && <> <ChevronRight size={12} /> <span>{activeCategoryObj.name}</span> </>}
        </div>

        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', textTransform: 'capitalize' }}>
          {searchParam ? `Search Results for "${searchParam}"` : (activeCategoryObj ? activeCategoryObj.name : 'All Products')}
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
          Showing {totalProducts} luxury timepieces, frames, and accessories
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '3rem' }}>
        {/* Left Filter Sidebar */}
        <aside>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={16} /> Filters
            </span>
            {(categoryParam || subCategoryParam || searchParam || minPrice || maxPrice || inStockParam) && (
              <button onClick={clearAllFilters} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'underline' }}>
                Clear All
              </button>
            )}
          </div>

          {/* Category Tree */}
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Categories
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.875rem' }}>
              <button 
                onClick={() => { updateParam('category', ''); updateParam('subCategory', ''); }}
                style={{ textAlign: 'left', fontWeight: !categoryParam ? 700 : 400, color: !categoryParam ? '#000' : 'var(--text-secondary)' }}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <div key={cat._id}>
                  <button 
                    onClick={() => { updateParam('category', cat.slug); updateParam('subCategory', ''); }}
                    style={{ textAlign: 'left', width: '100%', fontWeight: categoryParam === cat.slug ? 700 : 400, color: categoryParam === cat.slug ? '#000' : 'var(--text-secondary)' }}
                  >
                    {cat.name}
                  </button>

                  {/* Nested Subcategories */}
                  {categoryParam === cat.slug && cat.subCategories && cat.subCategories.length > 0 && (
                    <div style={{ paddingLeft: '1rem', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {cat.subCategories.map((sub) => (
                        <button 
                          key={sub._id}
                          onClick={() => updateParam('subCategory', sub.slug)}
                          style={{
                            textAlign: 'left',
                            fontSize: '0.8rem',
                            fontWeight: subCategoryParam === sub.slug ? 700 : 400,
                            color: subCategoryParam === sub.slug ? '#000' : 'var(--text-muted)'
                          }}
                        >
                          &bull; {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Availability Filter */}
          <div style={{ marginBottom: '2rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Availability
            </h4>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={inStockParam} 
                onChange={(e) => updateParam('inStock', e.target.checked ? 'true' : '')} 
              />
              In Stock Only
            </label>
          </div>

          {/* Price Filter */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
            <h4 style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
              Price Range (PKR)
            </h4>
            <form onSubmit={handlePriceApply} style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  type="number" 
                  placeholder="Min" 
                  value={minPrice} 
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="form-input"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                />
                <input 
                  type="number" 
                  placeholder="Max" 
                  value={maxPrice} 
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="form-input"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.8rem' }}
                />
              </div>
              <button type="submit" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>Apply Price</button>
            </form>
          </div>
        </aside>

        {/* Right Main Catalog */}
        <main>
          {/* Sorting Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)', marginBottom: '2rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Showing {products.length} of {totalProducts} items
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sort By:</label>
              <select 
                value={sortParam} 
                onChange={(e) => updateParam('sort', e.target.value)}
                className="form-select"
                style={{ width: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              >
                <option value="newest">Newest Arrivals</option>
                <option value="featured">Featured First</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '6rem' }}>
              <div className="spinner"></div>
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-sm)' }}>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>No Products Found</h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                We couldn't find any products matching your current filters.
              </p>
              <button onClick={clearAllFilters} className="btn btn-primary btn-sm">Clear All Filters</button>
            </div>
          ) : (
            <>
              <div className="grid-products">
                {products.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '4rem' }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => updateParam('page', p.toString())}
                      className={`btn btn-sm ${p === pageParam ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ minWidth: '38px' }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .container > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
