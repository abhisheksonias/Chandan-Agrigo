import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

// Monthly Revenue Bar Chart
export const MonthlyRevenueChart = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    // Clear previous chart if it exists
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Create new chart
    if (chartRef.current && data && data.length > 0) {
      const ctx = chartRef.current.getContext('2d');
      
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.map(item => item.label),
          datasets: [{
            label: 'Monthly Revenue (₹)',
            data: data.map(item => item.revenue),
            backgroundColor: 'rgba(75, 192, 192, 0.6)',
            borderColor: 'rgb(75, 192, 192)',
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '₹' + value;
                }
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="h-[300px]">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

// Top Products Horizontal Bar Chart
export const TopProductsChart = ({ products }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (chartRef.current && products && products.length > 0) {
      const ctx = chartRef.current.getContext('2d');
      
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: products.map(product => 
            product.name.length > 20 ? product.name.substring(0, 20) + '...' : product.name
          ),
          datasets: [{
            label: 'Units Sold',
            data: products.map(product => product.quantity),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgb(54, 162, 235)',
            borderWidth: 1
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              beginAtZero: true
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [products]);

  return (
    <div className="h-[400px]">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

// Revenue Trend Line Chart
export const RevenueTrendChart = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (chartRef.current && data && data.length > 0) {
      const ctx = chartRef.current.getContext('2d');
      
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map(item => item.label),
          datasets: [{
            label: 'Revenue Trend (₹)',
            data: data.map(item => item.revenue),
            fill: false,
            borderColor: 'rgb(255, 99, 132)',
            tension: 0.1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '₹' + value;
                }
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="h-[300px]">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

// Product Category Distribution Pie Chart
export const ProductCategoryDistributionChart = ({ categories }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (chartRef.current && categories && categories.length > 0) {
      const ctx = chartRef.current.getContext('2d');
      
      // Generate distinct colors for each category
      const generateColors = (count) => {
        const colors = [];
        const backgroundColors = [];
        
        for (let i = 0; i < count; i++) {
          const hue = (i * 360) / count;
          colors.push(`hsl(${hue}, 70%, 50%)`);
          backgroundColors.push(`hsl(${hue}, 70%, 70%)`);
        }
        
        return { colors, backgroundColors };
      };
      
      // Generate more vivid and distinct colors for each product in the category
      const generateProductColors = () => {
        // Create a map for each category with distinct colors
        const colorMap = {};
        
        categories.forEach((category) => {
          const categoryColors = [];
          const categoryBackgroundColors = [];
          
          // Calculate a base hue for this category (each category gets its own color range)
          const baseCategoryHue = (categories.indexOf(category) * 137) % 360; // Use prime number for better distribution
          
          // Generate colors within that category's hue range with varying saturation and lightness
          const productCount = category.products?.length || 1;
          for (let i = 0; i < productCount; i++) {
            const hue = (baseCategoryHue + (i * 30)) % 360; // 30 degree shift per product
            const saturation = 65 + (i * 5) % 20; // Vary saturation
            const lightness = 40 + (i * 7) % 20; // Vary lightness
            
            categoryColors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
            categoryBackgroundColors.push(`hsl(${hue}, ${saturation}%, ${lightness + 15}%)`);
          }
          
          colorMap[category.name] = {
            colors: categoryColors,
            backgroundColors: categoryBackgroundColors
          };
        });
        
        return colorMap;
      };
      
      const productColorMap = generateProductColors();
      const { colors, backgroundColors } = generateColors(categories.length);
        // Create a vibrant color scheme for categories
      const generateVibrantColors = (count) => {
        // Predefined vibrant colors that work well together
        const vibrantColors = [
          'rgba(255, 99, 132, 0.8)',   // bright red/pink
          'rgba(54, 162, 235, 0.8)',   // bright blue
          'rgba(255, 206, 86, 0.8)',   // yellow
          'rgba(75, 192, 192, 0.8)',   // teal
          'rgba(153, 102, 255, 0.8)',  // purple
          'rgba(255, 159, 64, 0.8)',   // orange
          'rgba(46, 204, 113, 0.8)',   // green
          'rgba(142, 68, 173, 0.8)',   // deep purple
          'rgba(241, 196, 15, 0.8)',   // yellow/gold
          'rgba(231, 76, 60, 0.8)'     // red
        ];
        
        const result = [];
        for (let i = 0; i < count; i++) {
          if (i < vibrantColors.length) {
            result.push(vibrantColors[i]);
          } else {
            // For additional colors beyond the predefined ones, generate new ones
            const hue = (i * 137.5) % 360; // Use golden angle approximation for better distribution
            result.push(`hsla(${hue}, 85%, 60%, 0.8)`);
          }
        }
        return result;
      };
      
      const vibrantColors = generateVibrantColors(categories.length);
      const borderColors = vibrantColors.map(color => color.replace('0.8)', '1)'));
      
      chartInstance.current = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: categories.map(category => category.name),
          datasets: [{
            label: 'Revenue by Category',
            data: categories.map(category => category.revenue),
            backgroundColor: vibrantColors,
            borderColor: borderColors,
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'right',
              labels: {
                generateLabels: function(chart) {
                  // Get the default legend items
                  const original = Chart.overrides.doughnut.plugins.legend.labels.generateLabels(chart);
                  
                  // Add product details to tooltips
                  original.forEach(item => {
                    const category = categories[item.index];
                    if (category && category.products && category.products.length > 0) {
                      item.text += ` (${category.products.length} products)`;
                    }
                  });
                  
                  return original;
                }
              }
            },
            tooltip: {
              callbacks: {
                label: function(context) {
                  const value = context.raw;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const percentage = Math.round((value / total) * 100);
                  return `₹${value.toFixed(2)} (${percentage}%)`;
                },
                afterLabel: function(context) {
                  const category = categories[context.dataIndex];
                  if (category && category.products && category.products.length > 0) {
                    // Show top 3 products in tooltip
                    return category.products
                      .slice(0, 3)
                      .map(p => `- ${p.name}: ₹${p.revenue.toFixed(2)}`);
                  }
                  return [];
                }
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [categories]);

  return (
    <div className="h-[300px]">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};

// Customer Orders by Location Map
export const CustomerLocationChart = ({ locationData }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (chartRef.current && locationData && Object.keys(locationData).length > 0) {
      const ctx = chartRef.current.getContext('2d');
      const locations = Object.keys(locationData);
      
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: locations,
          datasets: [
            {
              label: 'Number of Orders',
              data: locations.map(location => locationData[location].orderCount),
              backgroundColor: 'rgba(153, 102, 255, 0.6)',
              borderColor: 'rgb(153, 102, 255)',
              borderWidth: 1
            },
            {
              label: 'Revenue (₹)',
              data: locations.map(location => locationData[location].revenue),
              backgroundColor: 'rgba(255, 159, 64, 0.6)',
              borderColor: 'rgb(255, 159, 64)',
              borderWidth: 1,
              yAxisID: 'revenue'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of Orders'
              }
            },
            revenue: {
              beginAtZero: true,
              position: 'right',
              grid: {
                drawOnChartArea: false
              },
              title: {
                display: true,
                text: 'Revenue (₹)'
              },
              ticks: {
                callback: function(value) {
                  return '₹' + value;
                }
              }
            }
          }
        }
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [locationData]);

  return (
    <div className="h-[300px]">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};
