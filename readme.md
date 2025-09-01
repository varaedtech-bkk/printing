# Overview

SRC Thailand is a web-to-print e-commerce platform that allows users to design and order custom print materials online. The application features AI-powered design tools including text-to-design generation, automatic background removal, and intelligent color palette suggestions. Built as a full-stack TypeScript application targeting the Thai market with multi-language support and local payment integrations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with Tailwind CSS styling using the shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Canvas Editor**: Fabric.js integration for the design editor functionality
- **Styling**: Tailwind CSS with custom CSS variables for theming, supporting both Thai and English fonts

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful APIs with JSON responses
- **Database ORM**: Drizzle ORM with Neon PostgreSQL serverless database
- **File Structure**: Organized into routes, storage layer, and AI service modules
- **Development**: Hot reload with Vite integration in development mode

### Design Editor System
- **Canvas Management**: HTML5 Canvas with Fabric.js for interactive design editing
- **Features**: Drag-and-drop elements, text editing, image manipulation, template system
- **Print Specifications**: Support for bleed zones, safe areas, and CMYK color profiles
- **State Persistence**: Design projects saved to database with user sessions

### AI Integration
- **Provider**: OpenAI GPT-4o model for AI-powered features
- **Capabilities**: 
  - Text-to-design generation with layout suggestions
  - Automatic background removal for images
  - Smart color palette generation
  - Design variation recommendations
- **Processing**: Server-side AI calls with structured JSON responses

### Data Storage
- **Database**: PostgreSQL via Neon serverless with connection pooling
- **Schema**: Comprehensive relational schema including users, products, design projects, orders, and cart items
- **Migrations**: Drizzle Kit for database schema management
- **Relationships**: Proper foreign key relationships between entities

### Authentication & User Management
- **Strategy**: JWT-based authentication (implementation ready)
- **User Data**: Profile management with phone, address, and design project storage
- **Sessions**: Temporary user support for guest checkout functionality

### Internationalization
- **Languages**: Thai and English language support
- **Implementation**: Structure ready for i18n integration
- **Localization**: Thai-specific features like PromptPay payments and local shipping

## External Dependencies

### Payment Processing
- **Primary**: PromptPay integration via 2C2P or Omise payment gateways
- **Secondary**: Credit card processing support
- **Currency**: Thai Baht (THB) pricing and calculations

### Shipping Integration
- **Providers**: Kerry Express and Flash Express APIs for shipping calculations
- **Features**: Real-time shipping cost calculation and package tracking
- **Coverage**: Thailand domestic shipping with express delivery options

### Database Services
- **Provider**: Neon PostgreSQL serverless database
- **Features**: Connection pooling, automatic scaling, and backup management
- **Configuration**: Environment-based connection string with SSL support

### AI Services
- **Provider**: OpenAI API for GPT-4o model access
- **Usage**: Design generation, image analysis, and content recommendations
- **Rate Limiting**: Managed through API key configuration

### Development Tools
- **Build System**: Vite with TypeScript and React plugins
- **Development**: custom integration with runtime error overlay
- **Code Quality**: ESLint and TypeScript strict mode enabled

### UI Components
- **Library**: Radix UI primitives for accessible component foundations
- **Styling**: Tailwind CSS with custom design tokens
- **Icons**: Lucide React icon library
- **Fonts**: Google Fonts integration with Thai language support

### Third-party Libraries
- **HTTP Client**: Fetch API with custom request wrapper
- **Form Handling**: React Hook Form with Zod validation
- **Date Handling**: date-fns for date manipulation
- **Canvas**: Fabric.js for design editor functionality
- **Image Processing**: Server-side image processing capabilities