#!/usr/bin/env node

/**
 * MAGENTO API AUTOMATED TESTING SYSTEM
 * Systematically tests all Postman endpoints and saves responses
 * Based on Magento.postman_collection.json
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class MagentoAPITester {
    constructor() {
        this.baseUrl = 'https://woodstockoutlet.com';
        this.credentials = {
            username: "jlasse@aiprlassist.com",
            password: "bV38.O@3&/a{"
        };
        this.token = null;
        this.responses = [];
        this.outputFile = path.join(__dirname, 'MAGENTO_API_RESPONSES.md');
        
        console.log('🔧 Magento API Tester initialized');
        console.log('📁 Responses will be saved to:', this.outputFile);
    }

    /**
     * Make HTTP request with proper error handling
     */
    async makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port || 443,
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Magento-API-Tester/1.0',
                    ...options.headers
                }
            };

            const req = https.request(requestOptions, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            data: jsonData
                        });
                    } catch (e) {
                        resolve({
                            statusCode: res.statusCode,
                            headers: res.headers,
                            data: data
                        });
                    }
                });
            });

            req.on('error', reject);
            
            if (options.body) {
                req.write(JSON.stringify(options.body));
            }
            
            req.end();
        });
    }

    /**
     * Get Magento admin token
     */
    async getToken() {
        console.log('🔑 Getting Magento admin token...');
        
        try {
            const response = await this.makeRequest(
                `${this.baseUrl}/rest/all/V1/integration/admin/token`,
                {
                    method: 'POST',
                    body: this.credentials
                }
            );

            if (response.statusCode === 200) {
                this.token = response.data.replace(/"/g, '');
                console.log('✅ Token obtained:', this.token.substring(0, 20) + '...');
                
                this.responses.push({
                    endpoint: 'Get Integration Token',
                    url: '/rest/all/V1/integration/admin/token',
                    method: 'POST',
                    statusCode: response.statusCode,
                    response: response.data,
                    timestamp: new Date().toISOString()
                });
                
                return true;
            } else {
                console.error('❌ Token request failed:', response.statusCode);
                return false;
            }
        } catch (error) {
            console.error('❌ Token error:', error);
            return false;
        }
    }

    /**
     * Test all endpoints from Postman collection
     */
    async testAllEndpoints() {
        if (!this.token) {
            console.error('❌ No token available');
            return;
        }

        const endpoints = [
            {
                name: 'Get Schema All',
                url: '/rest/all/schema?services=all',
                method: 'GET',
                needsAuth: false
            },
            {
                name: 'Get Customer By Email',
                url: '/rest/V1/customers/search?searchCriteria[filterGroups][0][filters][0][field]=email&searchCriteria[filterGroups][0][filters][0][value]=cerebix1@gmail.com&searchCriteria[filterGroups][0][filters][0][condition_type]=eq',
                method: 'GET',
                needsAuth: true
            },
            {
                name: 'Get All Categories',
                url: '/rest/V1/categories',
                method: 'GET',
                needsAuth: true
            },
            {
                name: 'Magento Show All Enabled Products with PIM Unique Key',
                url: '/rest/V1/products?searchCriteria[pageSize]=20&searchCriteria[current_page]=1&searchCriteria[filter_groups][0][filters][0][field]=pim_unique_id&searchCriteria[filter_groups][0][filters][0][condition_type]=notnull&searchCriteria[filter_groups][1][filters][0][field]=status&searchCriteria[filter_groups][1][filters][0][value]=2&searchCriteria[filter_groups][1][filters][0][condition_type]=eq',
                method: 'GET',
                needsAuth: true
            },
            {
                name: 'Get Single Product By SKU',
                url: '/rest/V1/products/124985831',
                method: 'GET',
                needsAuth: true
            },
            {
                name: 'Get Single Product By Loft ID',
                url: '/rest/V1/products?searchCriteria[filter_groups][0][filters][0][field]=pim_unique_id&searchCriteria[filter_groups][0][filters][0][condition_type]=notnull&searchCriteria[filter_groups][1][filters][0][field]=loft_id&searchCriteria[filter_groups][1][filters][0][value]=124985831&searchCriteria[filter_groups][1][filters][0][conditionType]=eq',
                method: 'GET',
                needsAuth: true
            },
            {
                name: 'Customer by ID',
                url: '/rest/V1/customers/1',
                method: 'GET',
                needsAuth: true
            },
            {
                name: 'Get All Configurable Products',
                url: '/rest/V1/products?searchCriteria[pageSize]=20&searchCriteria[filter_groups][0][filters][0][field]=pim_unique_id&searchCriteria[filter_groups][0][filters][0][condition_type]=notnull&searchCriteria[filter_groups][1][filters][0][field]=type_id&searchCriteria[filter_groups][1][filters][0][value]=configurable&searchCriteria[filter_groups][1][filters][0][conditionType]=eq',
                method: 'GET',
                needsAuth: true
            },
            {
                name: 'Get Multiple Products based on ID List',
                url: '/rest/V1/products?searchCriteria[filter_groups][0][filters][0][field]=pim_unique_id&searchCriteria[filter_groups][0][filters][0][condition_type]=notnull&searchCriteria[filter_groups][1][filters][0][field]=entity_id&searchCriteria[filter_groups][1][filters][0][value]=7483,7484&searchCriteria[filter_groups][1][filters][0][conditionType]=in',
                method: 'GET',
                needsAuth: true
            },
            {
                name: 'Get Media for a specific product by sku',
                url: '/rest/V1/products/857087572/media',
                method: 'GET',
                needsAuth: true
            },
            {
                name: 'Magento get attribute set list',
                url: '/rest/V1/products/attribute-sets/sets/list?searchCriteria=0',
                method: 'GET',
                needsAuth: true
            },
            {
                name: 'Pull All Categories',
                url: '/rest/V1/categories/list/?searchCriteria[pageSize]=100',
                method: 'GET',
                needsAuth: true
            },
            {
                name: 'Pull Color Attribute',
                url: '/rest/V1/products/attributes/color',
                method: 'GET',
                needsAuth: true
            },
            {
                name: 'Get All Brand Options',
                url: '/rest/V1/products/attributes/brand/options',
                method: 'GET',
                needsAuth: true
            },
            {
                name: 'Get All Pending Orders',
                url: '/rest/V1/orders/?searchCriteria[filterGroups][0][filters][0][field]=status&searchCriteria[filterGroups][0][filters][0][value]=pending&searchCriteria[filterGroups][0][filters][0][conditionType]=eq',
                method: 'GET',
                needsAuth: true
            },
            {
                name: 'Get All Orders For a specific customer by customer ID',
                url: '/rest/V1/orders/?searchCriteria[filterGroups][0][filters][0][field]=customer_id&searchCriteria[filterGroups][0][filters][0][value]=1&searchCriteria[filterGroups][0][filters][0][conditionType]=eq',
                method: 'GET',
                needsAuth: true
            },
            {
                name: 'Get All Orders For a specific customer by customer Email',
                url: '/rest/V1/orders/?searchCriteria[filterGroups][0][filters][0][field]=customer_email&searchCriteria[filterGroups][0][filters][0][value]=cerebix1@gmail.com&searchCriteria[filterGroups][0][filters][0][conditionType]=eq',
                method: 'GET',
                needsAuth: true
            }
        ];

        console.log(`🧪 Testing ${endpoints.length} endpoints...`);

        for (let i = 0; i < endpoints.length; i++) {
            const endpoint = endpoints[i];
            console.log(`\n📡 [${i + 1}/${endpoints.length}] Testing: ${endpoint.name}`);
            
            try {
                const headers = endpoint.needsAuth ? { 'Authorization': `Bearer ${this.token}` } : {};
                
                const response = await this.makeRequest(
                    `${this.baseUrl}${endpoint.url}`,
                    {
                        method: endpoint.method,
                        headers
                    }
                );

                console.log(`   Status: ${response.statusCode}`);
                
                this.responses.push({
                    endpoint: endpoint.name,
                    url: endpoint.url,
                    method: endpoint.method,
                    statusCode: response.statusCode,
                    response: response.data,
                    timestamp: new Date().toISOString(),
                    success: response.statusCode >= 200 && response.statusCode < 300
                });

                // Add delay to be respectful to the API
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.error(`   ❌ Error: ${error.message}`);
                
                this.responses.push({
                    endpoint: endpoint.name,
                    url: endpoint.url,
                    method: endpoint.method,
                    statusCode: 'ERROR',
                    response: error.message,
                    timestamp: new Date().toISOString(),
                    success: false
                });
            }
        }
    }

    /**
     * Save all responses to markdown file
     */
    async saveResponses() {
        console.log('\n💾 Saving responses to file...');
        
        let markdown = `# MAGENTO API RESPONSES - COMPLETE COLLECTION\n\n`;
        markdown += `**Generated:** ${new Date().toISOString()}\n`;
        markdown += `**Total Endpoints Tested:** ${this.responses.length}\n`;
        markdown += `**Successful Responses:** ${this.responses.filter(r => r.success).length}\n`;
        markdown += `**Failed Responses:** ${this.responses.filter(r => !r.success).length}\n\n`;
        
        markdown += `---\n\n`;

        for (let i = 0; i < this.responses.length; i++) {
            const response = this.responses[i];
            const status = response.success ? '✅' : '❌';
            
            markdown += `## ${i + 1}. ${status} ${response.endpoint}\n\n`;
            markdown += `**URL:** \`${response.method} ${response.url}\`\n`;
            markdown += `**Status Code:** ${response.statusCode}\n`;
            markdown += `**Timestamp:** ${response.timestamp}\n\n`;
            
            markdown += `### Response:\n\n`;
            markdown += `\`\`\`json\n`;
            
            if (typeof response.response === 'object') {
                markdown += JSON.stringify(response.response, null, 2);
            } else {
                markdown += response.response;
            }
            
            markdown += `\n\`\`\`\n\n`;
            markdown += `---\n\n`;
        }

        // Save to file
        fs.writeFileSync(this.outputFile, markdown, 'utf8');
        console.log(`✅ Responses saved to: ${this.outputFile}`);
        
        // Also save as JSON for programmatic access
        const jsonFile = this.outputFile.replace('.md', '.json');
        fs.writeFileSync(jsonFile, JSON.stringify(this.responses, null, 2), 'utf8');
        console.log(`✅ JSON data saved to: ${jsonFile}`);
    }

    /**
     * Generate summary report
     */
    generateSummary() {
        console.log('\n📊 TESTING SUMMARY:');
        console.log('==================');
        
        const successful = this.responses.filter(r => r.success);
        const failed = this.responses.filter(r => !r.success);
        
        console.log(`Total Endpoints: ${this.responses.length}`);
        console.log(`Successful: ${successful.length} (${Math.round(successful.length/this.responses.length*100)}%)`);
        console.log(`Failed: ${failed.length} (${Math.round(failed.length/this.responses.length*100)}%)`);
        
        if (failed.length > 0) {
            console.log('\n❌ Failed Endpoints:');
            failed.forEach(f => {
                console.log(`   - ${f.endpoint} (${f.statusCode})`);
            });
        }
        
        console.log(`\n📁 Full responses saved to: ${this.outputFile}`);
    }

    /**
     * Run complete test suite
     */
    async run() {
        console.log('🚀 Starting Magento API Testing Suite...\n');
        
        // Step 1: Get token
        const tokenSuccess = await this.getToken();
        if (!tokenSuccess) {
            console.error('❌ Cannot proceed without token');
            return;
        }
        
        // Step 2: Test all endpoints
        await this.testAllEndpoints();
        
        // Step 3: Save responses
        await this.saveResponses();
        
        // Step 4: Generate summary
        this.generateSummary();
        
        console.log('\n🎉 Testing complete!');
    }
}

// Run the tester if called directly
if (require.main === module) {
    const tester = new MagentoAPITester();
    tester.run().catch(console.error);
}

module.exports = MagentoAPITester;
