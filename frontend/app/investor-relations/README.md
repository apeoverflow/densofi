# Investor Relations Module

## Overview

The Investor Relations (IR) module provides a comprehensive view of Densofi's investment opportunity, key metrics, and business model for potential investors and strategic partners.

## 🏗️ Architecture

The IR module follows a modular design pattern with clear separation of concerns:

```
investor-relations/
├── page.tsx                    # Next.js page entry point with metadata
├── InvestorRelationsPage.tsx   # Main page component
├── components/                 # Reusable UI components
│   ├── MetricCard.tsx         # Individual metric display
│   ├── TractionChart.tsx      # Growth metrics visualization
│   ├── PricingTable.tsx       # Revenue model display
│   └── ContactSection.tsx     # Contact information
├── data/
│   └── metrics.ts             # Centralized data management
├── __tests__/                 # Test files
│   ├── InvestorRelationsPage.test.tsx
│   └── MetricCard.test.tsx
└── README.md                  # This documentation
```

## 📊 Key Features

### 1. Metric Cards
- **TAM (Total Addressable Market)**: $2.4B domain name industry
- **TVL (Total Value Locked)**: Current platform value
- **AUM (Assets Under Management)**: Domain and token values
- **Active Users**: Monthly platform engagement

### 2. Traction Visualization
- Interactive charts showing user growth and volume
- Monthly progression with projected values
- Domain registration and tokenization metrics

### 3. Revenue Model
- Multiple fee streams (1-3% range)
- Detailed pricing breakdown
- Revenue sharing structure

### 4. Contact & Resources
- Direct investor contact methods
- Links to technical documentation
- Platform demo access

## 🔧 Data Management

### Metrics Configuration

All metrics are centralized in `data/metrics.ts`:

```typescript
export const investorMetrics = {
  tam: {
    value: "$2.4B",
    subtitle: "Domain Name Market Size",
    uncertainty: false, // Based on industry reports
    description: "Global domain name industry market size..."
  },
  // ... other metrics
};
```

### Uncertainty Indicators

Values marked with `uncertainty: true` display a `?` symbol and tooltip to indicate estimates that need verification.

## 🎨 Styling

The module uses Tailwind CSS with the existing design system:

- **Theme**: Dark gradient backgrounds (`from-slate-900 to-gray-900`)
- **Colors**: Blue/purple accents matching brand
- **Components**: Glass-morphism cards with blur effects
- **Animations**: Framer Motion for smooth interactions

## 🧪 Testing

Tests are located in `__tests__/` directory:

```bash
# Run IR module tests
npm test investor-relations

# Run specific component test
npm test MetricCard.test.tsx
```

### Test Coverage
- Component rendering
- User interactions
- Data display accuracy
- External link handling
- Responsive behavior

## 🚀 Usage

### Adding New Metrics

1. Update `data/metrics.ts` with new metric:
```typescript
newMetric: {
  value: "$500K?",
  subtitle: "New Metric",
  uncertainty: true, // Mark as estimate
  description: "Description of the new metric..."
}
```

2. Add to component in `InvestorRelationsPage.tsx`:
```tsx
<MetricCard
  icon={<NewIcon className="w-8 h-8" />}
  title="New Metric"
  value={investorMetrics.newMetric.value}
  // ... other props
/>
```

### Updating Traction Data

Modify the `tractionData` object in `metrics.ts`:

```typescript
tractionData: {
  userGrowth: [
    { month: 'Jan 2025', users: 500 }, // Add new data points
    // ...
  ],
  // ...
}
```

### Adding New Contact Methods

Extend the `contactMethods` array in `ContactSection.tsx`:

```typescript
const contactMethods = [
  // ... existing methods
  {
    icon: <NewIcon className="w-6 h-6" />,
    title: "New Contact Method",
    description: "Description",
    contact: "contact-info",
    action: "https://example.com",
    primary: false
  }
];
```

## 📱 Responsive Design

The module is fully responsive with breakpoint-specific layouts:

- **Mobile**: Single column, stacked components
- **Tablet**: 2-column grid for metrics
- **Desktop**: 4-column grid, side-by-side charts

## 🔒 Security Considerations

### Data Validation
- All external links use `target="_blank"` with implied security
- Email links use `mailto:` protocol
- No user input collection (read-only page)

### Privacy
- No tracking scripts beyond existing site analytics
- No personal data collection
- External links clearly marked

## 🔄 Maintenance

### Regular Updates Needed

1. **Monthly**: Update traction metrics with real data
2. **Quarterly**: Review and update financial projections
3. **As needed**: Add new milestones and achievements

### Data Sources

- **TAM**: Industry reports (verify annually)
- **TVL/AUM**: Smart contract analytics
- **User metrics**: Platform analytics
- **Revenue**: Financial tracking systems

### Uncertainty Management

When updating estimated values:

1. Replace `?` markers with actual data
2. Set `uncertainty: false` in metrics
3. Update descriptions with data sources
4. Add verification dates in comments

## 🚨 Important Notes

### Legal Compliance
- All disclaimers must remain visible
- Investment disclaimers are required
- No investment advice provided

### Data Accuracy
- Values marked with `?` are estimates
- Verify all metrics before investor presentations
- Update projections based on actual performance

### Performance
- Images are optimized for web
- Charts use efficient rendering
- Animations respect user preferences

## 🔗 Integration

### Navigation
The IR page is integrated into the main navigation in `components/ui/Navbar.tsx`:

```typescript
{ label: 'Investors', href: '/investor-relations', showOn: [...] }
```

### SEO
Comprehensive metadata in `page.tsx` for search optimization and social sharing.

### Analytics
Page views and interactions tracked through existing site analytics.

---

## 📞 Developer Support

For questions about the IR module:

1. Check this documentation first
2. Review the test files for usage examples
3. Contact the development team for complex changes

**Last Updated**: December 2024
**Version**: 1.0.0
**Maintainer**: Densofi Development Team