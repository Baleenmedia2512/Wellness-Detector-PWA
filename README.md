# 🌿 Wellness Detector PWA

A mobile-friendly Progressive Web App for analyzing food nutrition from images using Google Gemini AI.

## ✨ Features

- 📱 **Mobile-First Design**: Optimized for smartphone use
- 📷 **AI Image Analysis**: Advanced food recognition using Google Gemini
- 🍎 **Smart Food Detection**: Identifies multiple foods in single images
- 📝 **Text Query Support**: Analyze foods by name when no image available
- 📊 **Nutrition Display**: Calories, carbs, protein, and fat breakdown
- 🌐 **PWA Support**: Installable, works offline after initial setup
- 🎨 **Green Theme**: Beautiful Tailwind CSS design

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Get Free Gemini API Key
- Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
- Sign up for a free account (1,500 requests/day free)
- Create and copy your API key

### 3. Configure Environment Variables
Edit `.env` and add your API key:
```env
REACT_APP_GEMINI_API_KEY=your_actual_api_key_here
```

### 4. Run the App
```bash
npm start
```
The app will open at `http://localhost:3000`

## 🤖 AI Analysis Features

### 📸 Image Analysis Mode:
- **Advanced Computer Vision**: Google Gemini AI identifies foods in photos
- **Multi-Food Detection**: Recognizes multiple food items in single images
- **Smart Nutrition Calculation**: AI estimates nutrition based on visual analysis
- **Confidence Scoring**: Get accuracy indicators for each detection

### 📝 Text Query Mode:
- **Natural Language**: Enter food names in plain text
- **Comprehensive Database**: Access to extensive nutrition information
- **Flexible Input**: Works with various food descriptions and preparations

## 📱 PWA Installation

### On Mobile:
1. Open the app in Chrome/Safari
2. Tap the "Add to Home Screen" option
3. The app will install like a native app

### On Desktop:
1. Look for the install icon in the address bar
2. Click to install the PWA

## 🛠️ Project Structure

```
src/
├── App.js                 # Main application logic
├── index.js              # React entry point
├── index.css             # Tailwind CSS imports
├── components/
│   ├── ImageUpload.js    # Photo capture/upload
│   ├── NutritionCard.js  # Results display
│   ├── LoadingSpinner.js # Loading animation
│   └── TestImageGuide.js # AI analysis guide
└── services/
    └── geminiService.js  # Google Gemini AI integration

public/
├── manifest.json         # PWA manifest
├── service-worker.js     # Offline caching
└── index.html           # HTML template
```

## 🎨 Design System

### Colors:
- **Primary Green**: `#22c55e`
- **Light Green**: `#dcfce7`
- **Dark Green**: `#15803d`

### Components:
- Rounded corners (`rounded-xl`)
- Green gradients for buttons
- Card-based layout with shadows
- Responsive grid system

## 🤖 AI Integration

The app uses Google Gemini AI for food analysis:

- **Model**: `gemini-1.5-flash`
- **Vision Capabilities**: Advanced food recognition in images
- **Text Analysis**: Natural language food queries
- **Response Format**: Structured JSON with nutrition data
- **Authentication**: API Key in environment variables

## 🔧 Customization

### Adding New Features:
- **Meal Tracking**: Store analysis history
- **Recipe Nutrition**: Analyze entire recipes
- **Goals Setting**: Daily nutrition targets
- **Export Data**: Save results as PDF/CSV
- **Barcode Scanner**: Add product lookup
- **Multiple Serving Sizes**: Portion calculations

### Styling Changes:
- Modify `tailwind.config.js` for custom colors
- Update component styles in individual files
- Use Tailwind utility classes

## 🌐 Deployment

### Build for Production:
```bash
npm run build
```

### Deploy Options:
- **Netlify**: Drag and drop `build/` folder
- **Vercel**: Connect GitHub repository
- **GitHub Pages**: Use `gh-pages` package

## 🔒 Privacy & Security

- **No Data Storage**: Images and queries analyzed locally via API only
- **No User Accounts**: Anonymous usage
- **HTTPS Required**: For camera access and PWA features
- **API Key Security**: Never exposed to users
- **No Image Upload to Google**: Images processed locally before API call

## 📱 Browser Support

### Fully Supported:
- Chrome 80+ (Android/Desktop)
- Safari 13+ (iOS/macOS)
- Firefox 75+ (Android/Desktop)
- Edge 80+ (Desktop)

### AI Features:
- Image analysis works in all modern browsers
- Camera access requires HTTPS
- File upload supported on all platforms

## 🐛 Troubleshooting

### Common Issues:

**Food not detected in image:**
- Ensure good lighting and clear focus
- Try different angles or closer shots
- Remove cluttered backgrounds
- Use text mode as fallback

**API errors:**
- Verify Gemini API key is correct
- Check daily limit (1,500 calls/day free)
- Ensure internet connection
- Check image file size (under 10MB)

**PWA not installing:**
- Must be served over HTTPS
- Service worker must be registered
- Manifest.json must be valid

### Error Messages:
- `"Gemini API key is not configured"` → Add API key to `.env` file
- `"No food items detected"` → Try better lighting or different angle
- `"Invalid response format"` → API response parsing issue, try again
- `"Failed to analyze image"` → Check image quality and internet connection

## 📝 License

MIT License - Feel free to use and modify for your projects.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Support

For issues or questions:
- Check the troubleshooting section
- Review Google Gemini AI documentation
- Create an issue on GitHub

---

Built with ❤️ using React, Tailwind CSS, and Google Gemini AI
