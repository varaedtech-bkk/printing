--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9 (84ade85)
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;
--
-- Name: cart_items; Type: TABLE; Schema: public; Owner: sunny
--

CREATE TABLE public.cart_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    product_id character varying,
    design_project_id character varying,
    quantity integer NOT NULL,
    selected_options jsonb,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.cart_items OWNER TO sunny;

--
-- Name: design_templates; Type: TABLE; Schema: public; Owner: sunny
--

CREATE TABLE public.design_templates (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    category_id character varying,
    name character varying NOT NULL,
    description text,
    thumbnail character varying,
    template_data jsonb,
    tags text[],
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.design_templates OWNER TO sunny;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: sunny
--

CREATE TABLE public.notifications (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    title character varying NOT NULL,
    body text,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO sunny;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: sunny
--

CREATE TABLE public.order_items (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    order_id character varying,
    product_id character varying,
    design_project_id character varying,
    quantity integer NOT NULL,
    selected_options jsonb,
    unit_price numeric(10,2) NOT NULL,
    total_price numeric(10,2) NOT NULL,
    design_data jsonb,
    print_files text[],
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.order_items OWNER TO sunny;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: sunny
--

CREATE TABLE public.orders (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    order_number character varying NOT NULL,
    status character varying DEFAULT 'pending'::character varying NOT NULL,
    subtotal numeric(10,2) NOT NULL,
    shipping_cost numeric(10,2) DEFAULT '0'::numeric,
    total_amount numeric(10,2) NOT NULL,
    payment_method character varying,
    payment_status character varying DEFAULT 'pending'::character varying,
    shipping_address jsonb,
    tracking_number character varying,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.orders OWNER TO sunny;

--
-- Name: product_categories; Type: TABLE; Schema: public; Owner: sunny
--

CREATE TABLE public.product_categories (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    name_en character varying NOT NULL,
    name_th character varying NOT NULL,
    slug character varying NOT NULL,
    description text,
    image character varying,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.product_categories OWNER TO sunny;

--
-- Name: product_options; Type: TABLE; Schema: public; Owner: sunny
--

CREATE TABLE public.product_options (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    product_id character varying,
    type character varying NOT NULL,
    name_en character varying NOT NULL,
    name_th character varying NOT NULL,
    default_price_modifier numeric(10,2) DEFAULT '0'::numeric,
    price_rules jsonb,
    is_default boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.product_options OWNER TO sunny;

--
-- Name: products; Type: TABLE; Schema: public; Owner: sunny
--

CREATE TABLE public.products (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    category_id character varying,
    vendor_id character varying,
    name_en character varying NOT NULL,
    name_th character varying NOT NULL,
    slug character varying NOT NULL,
    description text,
    base_price numeric(10,2) NOT NULL,
    image character varying,
    specifications jsonb,
    available_option_types jsonb,
    is_active boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.products OWNER TO sunny;

--
-- Name: user_design_projects; Type: TABLE; Schema: public; Owner: sunny
--

CREATE TABLE public.user_design_projects (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    user_id character varying,
    product_id character varying,
    template_id character varying,
    name character varying NOT NULL,
    design_data jsonb,
    preview_image character varying,
    is_completed boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.user_design_projects OWNER TO sunny;

--
-- Name: users; Type: TABLE; Schema: public; Owner: sunny
--


CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    phone character varying,
    role character varying,
    is_active boolean DEFAULT true,
    permissions jsonb,
    password character varying, -- Added for hashed passwords
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);

ALTER TABLE public.users OWNER TO sunny;

--
-- Data for Name: cart_items; Type: TABLE DATA; Schema: public; Owner: sunny
--

COPY public.cart_items (id, user_id, product_id, design_project_id, quantity, selected_options, unit_price, total_price, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: design_templates; Type: TABLE DATA; Schema: public; Owner: sunny
--

COPY public.design_templates (id, category_id, name, description, thumbnail, template_data, tags, is_active, created_at, updated_at) FROM stdin;
f36afbeb-8f42-49c6-92b2-108c0e574e28	ce3b94d3-4a1e-47c6-b17c-b3dcdd55878f	Modern Business Card Template	Clean and modern business card design	https://picsum.photos/seed/template-business-card/400/300	{"objects": [{"top": 0, "fill": "#f8f9fa", "left": 0, "type": "rect", "width": 324, "height": 194.4}, {"top": 20, "fill": "#212529", "left": 20, "text": "Your Name", "type": "text", "fontSize": 18}], "version": "5.3.0"}	{modern,clean,professional}	t	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
23484579-3043-4d80-85ca-6868a9cef4db	ed4d21cd-799e-4251-98ba-2afd4745c3fe	Event Flyer Template	Promotional flyer template for events	https://picsum.photos/seed/template-event-flyer/400/300	{"objects": [{"top": 0, "fill": "#6366f1", "left": 0, "type": "rect", "width": 421.2, "height": 595.2}, {"top": 100, "fill": "#ffffff", "left": 50, "text": "EVENT TITLE", "type": "text", "fontSize": 32}], "version": "5.3.0"}	{event,promotional,colorful}	t	2025-08-24 16:32:39.341745	2025-08-24 16:32:39.341745
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: sunny
--

COPY public.notifications (id, user_id, title, body, is_read, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: sunny
--

COPY public.order_items (id, order_id, product_id, design_project_id, quantity, selected_options, unit_price, total_price, design_data, print_files, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: sunny
--

COPY public.orders (id, user_id, order_number, status, subtotal, shipping_cost, total_amount, payment_method, payment_status, shipping_address, tracking_number, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: product_categories; Type: TABLE DATA; Schema: public; Owner: sunny
--

COPY public.product_categories (id, name_en, name_th, slug, description, image, is_active, created_at, updated_at) FROM stdin;
ce3b94d3-4a1e-47c6-b17c-b3dcdd55878f	Business Cards	Business Cards	business-cards	Professional business cards in various styles and materials	https://picsum.photos/seed/business-cards/800/600	t	2025-08-24 16:32:37.268251	2025-08-24 16:32:37.268251
ed4d21cd-799e-4251-98ba-2afd4745c3fe	Flyers & Brochures	Flyers & Brochures	flyers-brochures	Marketing materials and promotional flyers	https://picsum.photos/seed/flyers/800/600	t	2025-08-24 16:32:37.426314	2025-08-24 16:32:37.426314
b7fb2ee4-9272-4983-b38f-1191cfd5d8d3	Banners & Posters	Banners & Posters	banners-posters	Large format printing for events and advertising	https://picsum.photos/seed/banners/800/600	t	2025-08-24 16:32:37.571941	2025-08-24 16:32:37.571941
a2ce08d6-44c7-422e-b8ea-ee43a34dc7b2	Stickers & Labels	Stickers & Labels	stickers-labels	Custom stickers and labels for branding	https://picsum.photos/seed/stickers/800/600	t	2025-08-24 16:32:37.718319	2025-08-24 16:32:37.718319
\.


--
-- Data for Name: product_options; Type: TABLE DATA; Schema: public; Owner: sunny
--

COPY public.product_options (id, product_id, type, name_en, name_th, default_price_modifier, price_rules, is_default, created_at, updated_at) FROM stdin;
c4f274d1-f6ee-4182-8cf4-501a2972446b	c8473de6-9991-42a6-9dd0-0cd6c34fb2b9	finish	Matte Finish	Matte Finish	0.00	\N	t	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
6803fb5e-a8f7-4dba-9327-8f85886322a5	c8473de6-9991-42a6-9dd0-0cd6c34fb2b9	finish	Gloss Finish	Gloss Finish	0.30	\N	f	2025-08-24 16:32:39.341745	2025-08-24 16:32:39.341745
4899c9ae-3ed0-45e4-8458-59f8d93f4056	47931c83-cb82-430b-a3ac-f7f17d1d12f2	finish	UV Spot Coating	UV Spot Coating	1.50	\N	f	2025-08-24 16:32:39.571941	2025-08-24 16:32:39.571941
-- Paper options for Standard Business Card
paper-gloss-001	c8473de6-9991-42a6-9dd0-0cd6c34fb2b9	paper	Glossy Paper	กระดาษอาร์ตมัน	0.00	\N	t	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
paper-matte-001	c8473de6-9991-42a6-9dd0-0cd6c34fb2b9	paper	Matte Paper	กระดาษอาร์ตด้าน	0.50	\N	f	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
paper-premium-001	c8473de6-9991-42a6-9dd0-0cd6c34fb2b9	paper	Premium Cardstock	กระดาษพรีเมียม	1.20	\N	f	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
-- Size options for Standard Business Card
size-a6-001	c8473de6-9991-42a6-9dd0-0cd6c34fb2b9	size	A6 (105x148mm)	A6 (105x148มม.)	0.00	\N	t	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
size-a5-001	c8473de6-9991-42a6-9dd0-0cd6c34fb2b9	size	A5 (148x210mm)	A5 (148x210มม.)	1.50	\N	f	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
size-a4-001	c8473de6-9991-42a6-9dd0-0cd6c34fb2b9	size	A4 (210x297mm)	A4 (210x297มม.)	3.00	\N	f	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
-- Finish options for Standard Business Card
finish-gloss-001	c8473de6-9991-42a6-9dd0-0cd6c34fb2b9	finish	Gloss Lamination	ลามิเนตมัน	1.00	\N	f	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
finish-matte-001	c8473de6-9991-42a6-9dd0-0cd6c34fb2b9	finish	Matte Lamination	ลามิเนตด้าน	1.20	\N	f	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
finish-spot-uv-001	c8473de6-9991-42a6-9dd0-0cd6c34fb2b9	finish	Spot UV	สปอตยูวี	2.50	\N	f	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
-- Quantity options for Standard Business Card
qty-100-001	c8473de6-9991-42a6-9dd0-0cd6c34fb2b9	quantity	100	100	0.00	\N	t	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
qty-250-001	c8473de6-9991-42a6-9dd0-0cd6c34fb2b9	quantity	250	250	-0.20	\N	f	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
qty-500-001	c8473de6-9991-42a6-9dd0-0cd6c34fb2b9	quantity	500	500	-0.50	\N	f	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
qty-1000-001	c8473de6-9991-42a6-9dd0-0cd6c34fb2b9	quantity	1000	1000	-0.80	\N	f	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
-- Paper options for A5 Flyer
paper-gloss-002	6eae802f-e527-42e5-94bd-7c7544e3ce80	paper	Glossy Paper	กระดาษอาร์ตมัน	0.00	\N	t	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
paper-matte-002	6eae802f-e527-42e5-94bd-7c7544e3ce80	paper	Matte Paper	กระดาษอาร์ตด้าน	0.50	\N	f	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
paper-premium-002	6eae802f-e527-42e5-94bd-7c7544e3ce80	paper	Premium Cardstock	กระดาษพรีเมียม	1.20	\N	f	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
-- Finish options for A5 Flyer
finish-gloss-002	6eae802f-e527-42e5-94bd-7c7544e3ce80	finish	Gloss Lamination	ลามิเนตมัน	1.00	\N	f	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
finish-matte-002	6eae802f-e527-42e5-94bd-7c7544e3ce80	finish	Matte Lamination	ลามิเนตด้าน	1.20	\N	f	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
finish-spot-uv-002	6eae802f-e527-42e5-94bd-7c7544e3ce80	finish	Spot UV	สปอตยูวี	2.50	\N	f	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
-- Quantity options for A5 Flyer
qty-100-002	6eae802f-e527-42e5-94bd-7c7544e3ce80	quantity	100	100	0.00	\N	t	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
qty-250-002	6eae802f-e527-42e5-94bd-7c7544e3ce80	quantity	250	250	-0.20	\N	f	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
qty-500-002	6eae802f-e527-42e5-94bd-7c7544e3ce80	quantity	500	500	-0.50	\N	f	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
qty-1000-002	6eae802f-e527-42e5-94bd-7c7544e3ce80	quantity	1000	1000	-0.80	\N	f	2025-08-24 16:32:39.193395	2025-08-24 16:32:39.193395
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: sunny
--

COPY public.products (id, category_id, vendor_id, name_en, name_th, slug, description, base_price, image, specifications, available_option_types, is_active, created_at, updated_at) FROM stdin;
c8473de6-9991-42a6-9dd0-0cd6c34fb2b9	ce3b94d3-4a1e-47c6-b17c-b3dcdd55878f	\N	Standard Business Card	Standard Business Card	standard-business-card	Classic 9cm x 5.4cm business card with premium finish	2.50	https://picsum.photos/seed/product-business-card-standard/800/600	{"size": "9cm x 5.4cm", "colors": "Full Color (CMYK)", "finish": "Matte/Gloss", "material": "300gsm Art Card"}	["paper","finish","quantity"]	t	2025-08-24 16:32:37.864956	2025-08-24 16:32:37.864956
47931c83-cb82-430b-a3ac-f7f17d1d12f2	ce3b94d3-4a1e-47c6-b17c-b3dcdd55878f	\N	Premium Business Card	Premium Business Card	premium-business-card	Luxury business card with special finishes	4.00	https://picsum.photos/seed/product-business-card-premium/800/600	{"size": "9cm x 5.4cm", "colors": "Full Color + Special", "finish": "UV Spot/Embossing", "material": "350gsm Art Card"}	["paper","finish","coating","quantity"]	t	2025-08-24 16:32:38.014305	2025-08-24 16:32:38.014305
6eae802f-e527-42e5-94bd-7c7544e3ce80	ed4d21cd-799e-4251-98ba-2afd4745c3fe	\N	A5 Flyer	A5 Flyer	a5-flyer	Standard A5 promotional flyer	1.20	https://picsum.photos/seed/product-a5-flyer/800/600	{"size": "14.8cm x 21cm (A5)", "colors": "Full Color (CMYK)", "finish": "Matte/Gloss", "material": "150gsm Art Paper"}	["paper","finish","quantity"]	t	2025-08-24 16:32:38.160904	2025-08-24 16:32:38.160904
3bdbf89a-2a0f-4f8c-b951-ebd572052bce	b7fb2ee4-9272-4983-b38f-1191cfd5d8d3	\N	A4 Poster	A4 Poster	a4-poster	Standard A4 poster for indoor use	5.00	https://picsum.photos/seed/product-a4-poster/800/600	{"size": "21cm x 29.7cm (A4)", "colors": "Full Color (CMYK)", "finish": "Matte/Gloss", "material": "200gsm Photo Paper"}	["paper","finish","quantity"]	t	2025-08-24 16:32:38.307273	2025-08-24 16:32:38.307273
679ecdf6-0b1b-4466-b0e9-92629c2fac6a	b7fb2ee4-9272-4983-b38f-1191cfd5d8d3	\N	Vinyl Banner	Vinyl Banner	vinyl-banner	Durable outdoor vinyl banner	25.00	https://picsum.photos/seed/product-vinyl-banner/800/600	{"size": "Custom Size", "colors": "Full Color UV Print", "finish": "Waterproof", "material": "440gsm Vinyl"}	["material","finish","quantity"]	t	2025-08-24 16:32:38.453977	2025-08-24 16:32:38.453977
b5b1b0e9-31e6-4270-947b-5f7d2599937a	a2ce08d6-44c7-422e-b8ea-ee43a34dc7b2	\N	Round Sticker	Round Sticker	round-sticker	Custom round stickers	0.80	https://picsum.photos/seed/product-round-sticker/800/600	{"size": "5cm diameter", "colors": "Full Color", "finish": "Glossy/Matte", "material": "Vinyl with lamination"}	["size","finish","material","quantity"]	t	2025-08-24 16:32:38.600744	2025-08-24 16:32:38.600744
\.


--
-- Data for Name: user_design_projects; Type: TABLE DATA; Schema: public; Owner: sunny
--

COPY public.user_design_projects (id, user_id, product_id, template_id, name, design_data, preview_image, is_completed, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: sunny
--

COPY public.users (id, email, first_name, last_name, profile_image_url, phone, role, is_active, permissions, password, created_at, updated_at) FROM stdin;
customer-001	user@example.com	John	Doe	\N	123-456-7890	CUSTOMER	t	\N	\N	2025-08-24 16:32:36.758066	2025-08-24 16:32:36.758066
customer-002	janedoe@example.com	Jane	Doe	https://picsum.photos/seed/jane/200/200	987-654-3210	CUSTOMER	t	\N	\N	2025-08-24 16:32:36.883711	2025-08-24 16:32:36.883711
vend-001	vendor@example.com	Vendor	One	\N	555-444-3333	VENDOR	t	["order:view","order:update_status"]	\N	2025-08-24 16:32:37.019553	2025-08-24 16:32:37.019553
admin-001	admin@example.com	Admin	User	\N	555-123-4567	ADMIN	t	["user:manage","product:manage","order:manage","notifications:manage","admin:full_access"]	\N	2025-08-24 16:32:37.143224	2025-08-24 16:32:37.143224
\.


--
-- Name: cart_items cart_items_pkey; Type: CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);


--
-- Name: design_templates design_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.design_templates
    ADD CONSTRAINT design_templates_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_order_number_unique; Type: CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_pkey PRIMARY KEY (id);


--
-- Name: product_categories product_categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.product_categories
    ADD CONSTRAINT product_categories_slug_unique UNIQUE (slug);


--
-- Name: product_options product_options_pkey; Type: CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.product_options
    ADD CONSTRAINT product_options_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_slug_unique; Type: CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_slug_unique UNIQUE (slug);


--
-- Name: user_design_projects user_design_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.user_design_projects
    ADD CONSTRAINT user_design_projects_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: cart_items cart_items_design_project_id_user_design_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_design_project_id_user_design_projects_id_fk FOREIGN KEY (design_project_id) REFERENCES public.user_design_projects(id);


--
-- Name: cart_items cart_items_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: cart_items cart_items_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.cart_items
    ADD CONSTRAINT cart_items_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: design_templates design_templates_category_id_product_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.design_templates
    ADD CONSTRAINT design_templates_category_id_product_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.product_categories(id);


--
-- Name: notifications notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: order_items order_items_design_project_id_user_design_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_design_project_id_user_design_projects_id_fk FOREIGN KEY (design_project_id) REFERENCES public.user_design_projects(id);


--
-- Name: order_items order_items_order_id_orders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_orders_id_fk FOREIGN KEY (order_id) REFERENCES public.orders(id);


--
-- Name: order_items order_items_product_id_products_id_fk; Type: CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: orders orders_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: product_options product_options_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.product_options
    ADD CONSTRAINT product_options_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: products products_category_id_product_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_product_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.product_categories(id);


--
-- Name: products products_vendor_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_vendor_id_users_id_fk FOREIGN KEY (vendor_id) REFERENCES public.users(id);


--
-- Name: user_design_projects user_design_projects_product_id_products_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.user_design_projects
    ADD CONSTRAINT user_design_projects_product_id_products_id_fk FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: user_design_projects user_design_projects_template_id_design_templates_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.user_design_projects
    ADD CONSTRAINT user_design_projects_template_id_design_templates_id_fk FOREIGN KEY (template_id) REFERENCES public.design_templates(id);


--
-- Name: user_design_projects user_design_projects_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: sunny
--

ALTER TABLE ONLY public.user_design_projects
    ADD CONSTRAINT user_design_projects_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);
