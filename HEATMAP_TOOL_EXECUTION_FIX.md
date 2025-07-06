# Heatmap and Stacked Bar Chart Tool Execution Fix

## Issue Summary
Heatmap charts were not rendering in tool execution responses while they worked fine in the final output. Stacked bar charts needed verification for tool execution rendering.

## Root Cause
The issue was in the `parseChartData` function in `utils.ts`. While the code block parsing correctly routed heatmap and boxplot charts to Plotly rendering, the inline JSON parsing and line-by-line parsing were always setting `chartType = 'recharts'` regardless of the chart type.

This caused the following incorrect behavior:
- Heatmaps detected in tool responses → `chartType: 'recharts'` → `preferRecharts: true` → Attempted Recharts rendering → Empty/failed render
- Should have been: Heatmaps → `chartType: 'plotly'` → `preferRecharts: false` → Plotly rendering → Correct display

## Fix Applied
Updated three parsing sections in `parseChartData` function to consistently route chart types to the correct rendering engine:

### 1. Inline JSON Parsing (lines ~125-134)
**Before:**
```typescript
chartType = 'recharts';
```

**After:**
```typescript
// Route heatmap and boxplot to Plotly, others to Recharts
chartType = (entireContentParsed.type === 'heatmap' || entireContentParsed.type === 'boxplot') ? 'plotly' : 'recharts';
```

### 2. Line-by-Line Parsing (lines ~144-153)
**Before:**
```typescript
chartType = 'recharts';
```

**After:**
```typescript
// Route heatmap and boxplot to Plotly, others to Recharts
chartType = (parsed.type === 'heatmap' || parsed.type === 'boxplot') ? 'plotly' : 'recharts';
```

### 3. Special DataFrame Handling (lines ~175-190)
**Before:**
```typescript
chartType = 'recharts';
```

**After:**
```typescript
// Route heatmap and boxplot to Plotly, others to Recharts
chartType = (parsed.type === 'heatmap' || parsed.type === 'boxplot') ? 'plotly' : 'recharts';
```

## Chart Type Routing Logic
- **Heatmap** → `chartType: 'plotly'` → `preferRecharts: false` → Plotly rendering
- **Boxplot** → `chartType: 'plotly'` → `preferRecharts: false` → Plotly rendering  
- **Stacked Bar** → `chartType: 'recharts'` → `preferRecharts: true` → Recharts rendering
- **Other charts** → `chartType: 'recharts'` → `preferRecharts: true` → Recharts rendering

## Verification
Both chart types now render correctly in tool execution responses:

### Heatmap Test Result:
```
- chartType: "plotly"
- preferRecharts: false
- Should use Plotly: true ✅
```

### Stacked Bar Test Result:
```
- chartType: "recharts" 
- preferRecharts: true
- Should use Recharts: true ✅
```

## Files Modified
- `src/lib/utils.ts` - Fixed chart type routing in `parseChartData` function

## Testing
- Build successful with no TypeScript errors
- Chart parsing logic verified with test scripts
- Both heatmap and stacked bar charts now route to correct rendering engines

## Status
✅ **FIXED** - Heatmap charts now render correctly in tool execution responses
✅ **VERIFIED** - Stacked bar charts continue to work correctly in tool execution responses
✅ **CONFIRMED** - Both chart types maintain correct behavior in final output rendering
