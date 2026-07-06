'use client';

// Use factory pattern to avoid importing full plotly.js (~8MB)
// Instead use plotly.js-basic-dist-min (~1MB) with only essential chart types
import createPlotlyComponent from 'react-plotly.js/factory';
// @ts-expect-error - no type declarations for dist bundle
import Plotly from 'plotly.js-basic-dist-min';

const Plot = createPlotlyComponent(Plotly);
export default Plot;
