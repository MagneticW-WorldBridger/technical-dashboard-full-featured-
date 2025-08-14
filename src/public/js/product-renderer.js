/**
 * Woodstock Outlet - Product Renderer
 * Beautiful components for Magento products and composite results
 */

class ProductRenderer {
    constructor() {
        console.log('🎨 ProductRenderer initialized');
    }

    /**
     * Render a grid of multiple products (search results)
     */
    renderProductGrid(products) {
        if (!products || products.length === 0) {
            return `
                <div class="product-grid-empty">
                    <i class="fas fa-search" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-muted);">No products found</p>
                </div>
            `;
        }

        const carouselId = `carousel-${Date.now()}-${Math.floor(Math.random()*10000)}`;
        const productCards = products.map(product => this.renderProductCard(product)).join('');

        return `
            <div class="magento-product-grid">
                <div class="product-grid-header">
                    <h4><i class="fas fa-shopping-cart"></i> Found ${products.length} Products</h4>
                    <div class="carousel-controls">
                        <button class="carousel-btn" aria-label="previous" onclick="productRenderer.scrollCarousel('${carouselId}', -1)"><i class="fas fa-chevron-left"></i></button>
                        <button class="carousel-btn" aria-label="next" onclick="productRenderer.scrollCarousel('${carouselId}', 1)"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <div class="product-carousel" id="${carouselId}">
                    ${productCards}
                </div>
            </div>
        `;
    }

    /**
     * Render a single product card
     */
    renderProductCard(product) {
        const price = product.price ? `$${parseFloat(product.price).toLocaleString()}` : 'Price on request';
        const name = product.name || 'Product Name Not Available';
        const sku = product.sku || 'SKU N/A';
        const brand = this.extractBrand(product) || '';
        const imageUrl = this.getProductImageUrl(product);
        const itemCovering = this.getAttribute(product, 'item_covering') || this.getAttribute(product, 'fabric_color');
        const dims = this.extractDimensions(product);
        const dimsInline = dims && (dims.width || dims.depth || dims.height)
            ? `${dims.width ? dims.width : ''}${dims.width ? 'W' : ''} ${dims.depth ? dims.depth + 'D' : ''} ${dims.height ? dims.height + 'H' : ''}`.trim()
            : '';
        const imagesCount = (product.media_gallery_entries && product.media_gallery_entries.length) || 0;
        
        return `
            <div class="product-card" data-sku="${sku}">
                <div class="product-image">
                    ${imageUrl ? 
                        `<img src="${imageUrl}" alt="${name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` :
                        ''
                    }
                    <div class="product-placeholder" ${imageUrl ? 'style="display: none;"' : ''}>
                        <i class="fas fa-couch"></i>
                    </div>
                </div>
                <div class="product-info">
                    ${brand ? `<div class="product-brand">${brand}</div>` : ''}
                    <h5 class="product-name">${name}</h5>
                    <div class="product-sku">SKU: ${sku}</div>
                    <div class="product-price">${price}</div>
                    <div class="product-tags">
                        ${itemCovering ? `<span class="product-tag">${itemCovering}</span>` : ''}
                        ${dimsInline ? `<span class="product-tag">${dimsInline}</span>` : ''}
                        ${imagesCount ? `<span class="product-tag"><i class="fas fa-images"></i> ${imagesCount}</span>` : ''}
                    </div>
                </div>
                <div class="product-actions">
                    <button class="product-btn primary" onclick="productRenderer.showProductDetails('${sku}')">
                        <i class="fas fa-eye"></i> View Details
                    </button>
                    <button class="product-btn secondary" onclick="productRenderer.addToCart('${sku}')">
                        <i class="fas fa-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Render detailed product information
     */
    renderProductDetails(product) {
        const price = product.price ? `$${parseFloat(product.price).toLocaleString()}` : 'Price on request';
        const name = product.name || 'Product Name Not Available';
        const sku = product.sku || 'SKU N/A';
        const brand = this.extractBrand(product) || 'Unknown Brand';
        const description = this.extractDescription(product);
        const features = this.extractFeatures(product);
        const dimensions = this.extractDimensions(product);
        const images = this.getProductImages(product);
        
        return `
            <div class="product-details">
                <div class="product-details-header">
                    <h3><i class="fas fa-info-circle"></i> Product Details</h3>
                </div>
                
                <div class="product-details-content">
                    <div class="product-images">
                        ${this.renderProductImages(images, name)}
                    </div>
                    
                    <div class="product-main-info">
                        <div class="product-brand-tag">${brand}</div>
                        <h4 class="product-title">${name}</h4>
                        <div class="product-meta">
                            <span class="product-sku-badge">SKU: ${sku}</span>
                            <span class="product-price-main">${price}</span>
                        </div>
                        
                        ${description ? `
                            <div class="product-description">
                                <h5>Description</h5>
                                <div class="description-content">${description}</div>
                            </div>
                        ` : ''}
                        
                        ${features.length > 0 ? `
                            <div class="product-features">
                                <h5>Features</h5>
                                <ul class="features-list">
                                    ${features.map(feature => `<li><i class="fas fa-check"></i> ${feature}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                        
                        ${Object.keys(dimensions).length > 0 ? `
                            <div class="product-dimensions">
                                <h5>Dimensions</h5>
                                <div class="dimensions-grid">
                                    ${Object.entries(dimensions).map(([key, value]) => 
                                        value ? `<div class="dimension-item">
                                            <span class="dimension-label">${key.charAt(0).toUpperCase() + key.slice(1)}</span>
                                            <span class="dimension-value">${value}</span>
                                        </div>` : ''
                                    ).join('')}
                                </div>
                            </div>
                        ` : ''}
                        
                        <div class="product-actions-detail">
                            <button class="product-btn primary large" onclick="productRenderer.addToCart('${sku}')">
                                <i class="fas fa-shopping-cart"></i> Add to Cart
                            </button>
                            <button class="product-btn secondary large" onclick="productRenderer.requestQuote('${sku}')">
                                <i class="fas fa-envelope"></i> Request Quote
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render customer product journey with Magento enhancements
     */
    renderCustomerProductJourney(journeyData) {
        if (!journeyData || !journeyData.orders || journeyData.orders.length === 0) {
            return `
                <div class="journey-empty">
                    <i class="fas fa-route" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-muted);">No customer journey data available</p>
                </div>
            `;
        }

        const orders = journeyData.orders;
        const totalSpent = orders.reduce((sum, order) => sum + parseFloat(order.sum || 0), 0);
        
        return `
            <div class="customer-journey">
                <div class="journey-header">
                    <h3><i class="fas fa-route"></i> Customer Product Journey</h3>
                    <div class="journey-stats">
                        <div class="journey-stat">
                            <span class="stat-value">${orders.length}</span>
                            <span class="stat-label">Orders</span>
                        </div>
                        <div class="journey-stat">
                            <span class="stat-value">$${totalSpent.toLocaleString()}</span>
                            <span class="stat-label">Total Spent</span>
                        </div>
                    </div>
                </div>
                
                <div class="journey-timeline">
                    ${orders.map((order, index) => this.renderJourneyOrder(order, index)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render a single order in the journey timeline
     */
    renderJourneyOrder(order, index) {
        const orderDate = new Date(order.orderdate).toLocaleDateString();
        const deliveryDate = order.deliverydate ? new Date(order.deliverydate).toLocaleDateString() : 'TBD';
        const products = order.details || [];
        
        return `
            <div class="journey-order">
                <div class="journey-order-header">
                    <div class="order-timeline-dot">${index + 1}</div>
                    <div class="order-main-info">
                        <h4>Order #${order.orderid}</h4>
                        <div class="order-meta">
                            <span><i class="fas fa-calendar"></i> ${orderDate}</span>
                            <span><i class="fas fa-truck"></i> ${deliveryDate}</span>
                            <span class="order-status status-${order.status.toLowerCase()}">${this.getStatusText(order.status)}</span>
                        </div>
                    </div>
                    <div class="order-total">$${parseFloat(order.sum).toLocaleString()}</div>
                </div>
                
                <div class="journey-products">
                    ${products.map(product => this.renderJourneyProduct(product)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render a product within the journey with Magento enhancements
     */
    renderJourneyProduct(product) {
        const magentoData = product.magento_product;
        const hasEnhancedData = magentoData && magentoData.name;
        
        return `
            <div class="journey-product ${hasEnhancedData ? 'enhanced' : ''}">
                <div class="product-basic-info">
                    <div class="product-icon">
                        <i class="fas fa-cube"></i>
                    </div>
                    <div class="product-details-mini">
                        <h5>${hasEnhancedData ? magentoData.name : product.description}</h5>
                        <div class="product-meta-mini">
                            <span>SKU: ${product.productid}</span>
                            <span>Qty: ${product.qtyordered}</span>
                            <span class="product-price-mini">$${parseFloat(product.itemprice).toLocaleString()}</span>
                        </div>
                        
                        ${hasEnhancedData ? `
                            <div class="magento-enhancements">
                                <div class="enhancement-badge">Enhanced with Magento</div>
                                ${magentoData.brand ? `<span class="product-brand-mini">${magentoData.brand}</span>` : ''}
                                ${magentoData.features && magentoData.features.length > 0 ? `
                                    <div class="features-mini">
                                        ${magentoData.features.slice(0, 3).map(feature => 
                                            `<span class="feature-tag">${feature}</span>`
                                        ).join('')}
                                    </div>
                                ` : ''}
                                ${magentoData.dimensions && Object.keys(magentoData.dimensions).length > 0 ? `
                                    <div class="dimensions-mini">
                                        ${Object.entries(magentoData.dimensions).map(([key, value]) => 
                                            value ? `<span class="dimension-mini">${key}: ${value}</span>` : ''
                                        ).join('')}
                                    </div>
                                ` : ''}
                                ${magentoData.images_count > 0 ? `
                                    <span class="images-indicator">
                                        <i class="fas fa-images"></i> ${magentoData.images_count} images
                                    </span>
                                ` : ''}
                            </div>
                        ` : `
                            <div class="enhancement-note">
                                <i class="fas fa-info-circle"></i> Enhanced product data not available
                            </div>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render personalized recommendations
     */
    renderPersonalizedRecommendations(recommendationsData) {
        if (!recommendationsData || !recommendationsData.recommendations || recommendationsData.recommendations.length === 0) {
            return `
                <div class="recommendations-empty">
                    <i class="fas fa-lightbulb" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <p style="color: var(--text-muted);">No recommendations available</p>
                </div>
            `;
        }

        const customer = recommendationsData.customer;
        const patterns = recommendationsData.purchase_patterns || [];
        const recommendations = recommendationsData.recommendations;

        return `
            <div class="personalized-recommendations">
                <div class="recommendations-header">
                    <h3><i class="fas fa-magic"></i> Personalized Recommendations</h3>
                    <div class="customer-info-mini">
                        <span>${customer.firstname} ${customer.lastname}</span>
                        <span class="recommendations-count">${recommendations.length} suggestions</span>
                    </div>
                </div>

                ${patterns.length > 0 ? `
                    <div class="purchase-patterns">
                        <h4>Based on your preferences:</h4>
                        <div class="patterns-grid">
                            ${patterns.slice(0, 3).map(pattern => `
                                <div class="pattern-item">
                                    <span class="pattern-category">${pattern.category}</span>
                                    <span class="pattern-spent">$${parseFloat(pattern.total_spent).toLocaleString()}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="recommendations-grid">
                    ${recommendations.map(rec => this.renderRecommendationCard(rec)).join('')}
                </div>
            </div>
        `;
    }

    /**
     * Render a single recommendation card
     */
    renderRecommendationCard(recommendation) {
        const price = recommendation.price ? `$${parseFloat(recommendation.price).toLocaleString()}` : 'Price on request';
        const magento = recommendation.magento_details || {};
        
        return `
            <div class="recommendation-card">
                <div class="recommendation-header">
                    <h5>${recommendation.name}</h5>
                    <div class="recommendation-reason">${recommendation.reason}</div>
                </div>
                
                <div class="recommendation-details">
                    <div class="rec-price">${price}</div>
                    <div class="rec-category">${recommendation.category}</div>
                    
                    ${magento.brand ? `<div class="rec-brand">${magento.brand}</div>` : ''}
                    
                    ${magento.features && magento.features.length > 0 ? `
                        <div class="rec-features">
                            ${magento.features.slice(0, 2).map(feature => 
                                `<span class="rec-feature-tag">${feature}</span>`
                            ).join('')}
                        </div>
                    ` : ''}
                </div>
                
                <div class="recommendation-actions">
                    <button class="rec-btn primary" onclick="productRenderer.showProductDetails('${recommendation.product_id}')">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="rec-btn secondary" onclick="productRenderer.addToCart('${recommendation.product_id}')">
                        <i class="fas fa-plus"></i> Add
                    </button>
                </div>
            </div>
        `;
    }

    // Helper methods
    renderProductImages(images, altText) {
        if (!images || images.length === 0) {
            return `
                <div class="product-image-placeholder">
                    <i class="fas fa-couch"></i>
                    <span>No images available</span>
                </div>
            `;
        }

        return `
            <div class="product-image-gallery">
                <div class="main-image">
                    <img src="${images[0]}" alt="${altText}" onerror="this.parentElement.innerHTML='<div class=\\"image-error\\"><i class=\\"fas fa-image\\"></i><span>Image not available</span></div>'">
                </div>
                ${images.length > 1 ? `
                    <div class="image-thumbnails">
                        ${images.slice(1, 4).map((img, index) => 
                            `<img src="${img}" alt="${altText} ${index + 2}" onclick="productRenderer.switchMainImage(this.src)" onerror="this.style.display='none'">`
                        ).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    extractBrand(product) {
        if (!product.custom_attributes) return null;
        const brandAttr = product.custom_attributes.find(attr => attr.attribute_code === 'brand');
        return brandAttr ? brandAttr.value : null;
    }

    extractDescription(product) {
        if (!product.custom_attributes) return null;
        const descAttr = product.custom_attributes.find(attr => attr.attribute_code === 'description');
        if (descAttr && descAttr.value) {
            // Clean HTML and limit length
            const cleanDesc = descAttr.value.replace(/<[^>]*>/g, '').substring(0, 300);
            return cleanDesc + (cleanDesc.length === 300 ? '...' : '');
        }
        return null;
    }

    extractFeatures(product) {
        if (!product.custom_attributes) return [];
        const featuresAttr = product.custom_attributes.find(attr => attr.attribute_code === 'features');
        if (featuresAttr && featuresAttr.value) {
            return featuresAttr.value.split(',').map(f => f.trim()).filter(f => f.length > 0);
        }
        return [];
    }

    extractDimensions(product) {
        if (!product.custom_attributes) return {};
        const dims = {};
        const dimensionAttrs = ['width', 'height', 'depth', 'dim_width', 'dim_height', 'dim_depth'];
        
        dimensionAttrs.forEach(attr => {
            const dimAttr = product.custom_attributes.find(a => a.attribute_code === attr);
            if (dimAttr && dimAttr.value) {
                const key = attr.replace('dim_', '');
                dims[key] = dimAttr.value + (attr.includes('dim_') ? '"' : '');
            }
        });
        
        return dims;
    }

    getProductImageUrl(product) {
        if (product.media_gallery_entries && product.media_gallery_entries.length > 0) {
            const firstImage = product.media_gallery_entries[0];
            return `https://woodstockoutlet.com/media/catalog/product${firstImage.file}`;
        }
        return null;
    }

    getProductImages(product) {
        if (product.media_gallery_entries && product.media_gallery_entries.length > 0) {
            return product.media_gallery_entries.map(entry => 
                `https://woodstockoutlet.com/media/catalog/product${entry.file}`
            );
        }
        return [];
    }

    getAttribute(product, code) {
        if (!product.custom_attributes) return null;
        const attr = product.custom_attributes.find(a => a.attribute_code === code);
        return attr && attr.value ? attr.value : null;
    }

    getStatusText(status) {
        const statusMap = {
            'F': 'Fulfilled',
            'P': 'Pending',
            'S': 'Shipped',
            'C': 'Cancelled',
            'R': 'Returned'
        };
        return statusMap[status] || status;
    }

    // Action methods
    showProductDetails(sku) {
        console.log(`🔍 Showing details for SKU: ${sku}`);
        addBotMessage(`Fetching detailed information for product ${sku}...`);

        // Call backend function to get product by SKU and let the parser render details
        fetch(`${API_BASE}/api/functions/execute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ functionName: 'getMagentoProductBySKU', parameters: { sku } })
        })
        .then(r => r.json())
        .then(result => {
            console.log('[FE] details result for SKU', sku, result?.status);
            const wrapped = `**Function Result (getMagentoProductBySKU):**\n${JSON.stringify(result, null, 2)}`;
            addBotMessage(wrapped);
        })
        .catch(err => {
            console.warn('[FE] details fetch error', err);
            addBotMessage(`❌ Failed to load details for ${sku}.`);
        });
    }

    addToCart(sku) {
        console.log(`🛒 Adding to cart: ${sku}`);
        addBotMessage(`Added product ${sku} to cart! 🛒`);
    }

    requestQuote(sku) {
        console.log(`📧 Requesting quote for: ${sku}`);
        addBotMessage(`Quote request sent for product ${sku}! We'll contact you shortly. 📧`);
    }

    switchMainImage(src) {
        const mainImg = document.querySelector('.main-image img');
        if (mainImg) {
            mainImg.src = src;
        }
    }

    scrollCarousel(id, direction) {
        const el = document.getElementById(id);
        if (!el) return;
        const card = el.querySelector('.product-card');
        const step = card ? (card.offsetWidth + 16) : 320;
        el.scrollBy({ left: step * direction, behavior: 'smooth' });
    }
}

// Initialize the global productRenderer
window.productRenderer = new ProductRenderer();