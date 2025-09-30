# Woodstock AI Customer Scenarios

## Scenario 1: Pre-Authenticated Customer Journey with Cross-Sell Analytics

**Customer**: Sarah Johnson logs into Woodstock website → Chat widget detects `data-customer-email="sarah@johnson.email"` → Clicks chat bubble

**April**: "Hi Sarah! 👋 Welcome back to Woodstock! How can I help you today?"

**Customer**: "I'm looking for a sectional sofa for my living room."

**April**: "Perfect! I'd love to help you find the right sectional. Let me pull up your account to see if we can find something that matches your style preferences."

*[LOFT Functions: `get_customer_by_email`, `get_customer_journey`, `analyze_customer_patterns`]*

**April**: "I see you're one of our valued customers! I remember you got that beautiful Bolanburg Dining Set from us - such a great choice. Since you're looking for a sectional now, I can definitely help you find something that would complement your existing furniture beautifully."

*[Magento Endpoints: `/rest/V1/customers/search`, `/rest/V1/orders` by email, `/rest/V1/products` filtered]*

**Customer**: "Yes! I'm looking for a sectional that matches my dining room style."

**April**: "Absolutely! Let me show you some sectionals that would work beautifully with that style..."

*[LOFT Functions: `get_product_recommendations`, `search_magento_products`, `show_sectional_products`]*

**April**: "I found some great options for you! Here are 3 sectionals that would complement your dining room perfectly:

1. **Ashley Darcy Sectional** - Cobblestone, $1,899 
   *This would be gorgeous with your Bolanburg set - the tones work so well together*

2. **Signature Design Sectional** - Stone, $2,299 
   *Really popular right now, and the neutral color is so versatile*

3. **Modern Farmhouse L-Shape** - Cream, $1,749 
   *This style pairs beautifully with dining furniture like yours*

*[Displays product carousel with images, prices, availability]*

And since you're a returning customer, you qualify for our complimentary white-glove delivery service! Many customers also add some accent pillows or a coffee table to complete the look - I can show you some options if you'd like."

*[LOFT Functions: `handle_order_confirmation_cross_sell`, `get_customer_analytics`, `handle_loyalty_upgrade`]*

---

## Scenario 2: Guest Customer Multi-Factor Authentication with Expertise Routing

**Customer**: Mike visits Woodstock website (no login) → Clicks chat bubble

**April**: "Welcome to Woodstock! I'm April, your AI furniture consultant. To provide personalized assistance, I'll need to verify your identity for security."

**Customer**: "I want to check my recent dining table order status."

**April**: "I can help with that! For security, please provide:
• Your email address
• Last 4 digits of your phone number  
• Your recent order total or zip code"

**Customer**: "mike@email.com, phone ends in 1234, order was $599"

*[Magento Endpoints: `/rest/V1/customers/search`, `/rest/V1/orders` by email verification]*

**April**: "Perfect, thank you Mike! I found your account and I have great news about your dining set order!"

*[LOFT Functions: `get_customer_by_email`, `get_orders_by_customer`, `get_order_details`]*

**April**: "Your **Bolanburg Dining Set** (order #000000142) shipped yesterday and is on its way to you! It should arrive Thursday between 2-6 PM. Here are all the details:
• **Items**: 7-piece dining set, bench, 6 chairs
• **Delivery**: White-glove service included
• **Tracking**: FWDT240891234

Since you're getting this beautiful dining set, many customers add accent lighting or a matching buffet. Would you like to see complementary pieces?"

*[LOFT Functions: `handle_product_recommendations`, Magento: `/rest/V1/products` with category filters]*

**Customer**: "Actually, I'm worried about assembly. Is it complicated?"

**April**: "Perfect question! This dining set requires minimal assembly - just attaching legs to the table (about 20 minutes). However, I'm connecting you with our furniture expertise specialist who can provide detailed assembly guidance and schedule a call if needed."

*[LOFT Functions: `connect_to_support` with expertise routing]*

---

## Scenario 3: Proactive Issue Resolution with Support Escalation

**Customer**: Lisa (pre-authenticated via data attribute) opens chat

**April**: "Hi Lisa! Welcome back! How can I help you today?"

**Customer**: "Actually, there's a problem. One of the cushions on my sectional has a tear in the fabric."

*[LOFT Functions: `handle_support_escalation` - detects issue keywords]*

**April**: "Oh no, I'm so sorry to hear that! A fabric tear is definitely not something you should have to deal with. Let me get this taken care of right away and make sure we fix this for you."

*[Processing support escalation with customer identification]*

**April**: "I've created a priority support ticket for you and here's what's happening next:

**Support Ticket: #SUP-240915-0234**
**Issue**: Fabric tear on sectional cushion
**Next Steps**: 
1. Quality team notified (responds within 4 hours)
2. Replacement cushion expedited shipping 
3. $100 service credit applied to your account

I'm also connecting you with Sarah from our Quality Resolution team - she specializes in upholstery issues and will give you a call within the hour to discuss the next steps."

*[LOFT Functions: `connect_to_support`, `get_customer_analytics` for priority routing]*

**Customer**: "Wow, that was fast! Will the replacement match exactly?"

**April**: "Absolutely! I want to make sure you get a perfect match. Let me check the details on your specific sectional..."

*[Magento Endpoints: `/rest/V1/products/{sku}`, `/rest/V1/products/{sku}/media` for fabric specifications]*

**April**: "Your sectional is the Ashley Darcy in Cobblestone - beautiful choice! The good news is we keep detailed records of fabric batches, so your replacement cushion will be from the same production run to ensure a perfect color match. Sarah will also bring fabric samples when she comes out, just so you can see for yourself before we do the replacement.

And because this has been an inconvenience for you, I've added a service credit to your account and upgraded your customer status so you'll get priority support if you ever need anything in the future."

*[LOFT Functions: `handle_loyalty_upgrade`]*

---

## Scenario 4: Location-Based Inventory with Expert Consultation

**Customer**: David (authenticated) clicks chat while viewing recliners

**April**: "Hi David! Welcome back to Woodstock! I see you're looking at recliners - how can I help you find the perfect one?"

*[LOFT Functions: `get_customer_by_email`, `show_recliner_products`]*

**Customer**: "I need a recliner for my back issues. Something ergonomic."

**April**: "I completely understand - finding the right ergonomic support is so important for your comfort. Let me show you some recliners that are specifically designed for back support, and I can also connect you with one of our specialists who really knows about ergonomic furniture."

*[LOFT Functions: `show_directions`, expertise routing for health-related needs]*

**April**: "Here are some excellent ergonomic recliners I'd recommend, and since you're in the Atlanta area, these are all available at our showroom if you'd like to try them out:

1. **La-Z-Boy Maverick** - $1,499 ✅ **In Stock Atlanta**
   - Lumbar support system
   - Memory foam cushioning  
   - *6 available at showroom*

2. **Ashley Yandel Power Recliner** - $899 ✅ **In Stock Atlanta** 
   - Power headrest adjustment
   - USB charging ports
   - *3 available, 2 floor models*

3. **Signature Design Therapeutic** - $1,899 ⚠️ **Special Order**
   - Medical-grade lumbar system
   - Heat therapy built-in
   - *2-week delivery to Atlanta*

*[Magento Endpoints: `/rest/V1/products` with location-based inventory, `/rest/V1/categories` for medical furniture]*

**Would you like to visit our Atlanta showroom to try these out? It's pretty close to you, and I can also set up a consultation with our ergonomics specialist - she's there Tuesday through Thursday this week and really knows her stuff when it comes to back support."

*[LOFT Functions: `show_directions`, `connect_to_support` with specialist scheduling]*

**Customer**: "Yes, I'd like to test them in person and get expert advice."

**April**: "Perfect! Let me set that up for you. I can schedule you with Dr. Amanda Chen - she's our ergonomic specialist and she's fantastic at helping people find the right support for their specific needs.

**📍 Woodstock Outlet Atlanta**  
2947 Peachtree Road, Atlanta, GA 30305  
**Tuesday 2:00 PM - I'll reserve this time for you**

*[Google Maps integration showing route from customer location]*

And here's something nice - since you're taking the time to come in for a consultation, I'm going to add a $200 consultation credit to your account. If you end up purchasing a recliner during your visit, that credit will automatically apply.

I'll let Dr. Chen know you're coming and that you're specifically looking for back support, so she can have some targeted recommendations ready for you when you arrive."

*[LOFT Functions: `get_customer_analytics` for health preferences, `handle_loyalty_upgrade` for consultation credit]*
