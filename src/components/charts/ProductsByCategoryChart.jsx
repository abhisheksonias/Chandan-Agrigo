import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

// Products by Category Chart
export const ProductsByCategoryChart = ({ categories }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (chartRef.current && categories && categories.length > 0) {
      const ctx = chartRef.current.getContext('2d');
      
      // Filter to only include categories with products
      const categoriesWithProducts = categories.filter(cat => cat.products && cat.products.length > 0);
      if (categoriesWithProducts.length === 0) return;
      
      // Prepare datasets for each category (top 5 products)
      const datasets = [];
      const labels = [];
      const productsData = [];
      
      // Generate a color palette with distinct colors for each product
      const colors = [];
      
      // First, collect all products across all categories
      let allProducts = [];
      categoriesWithProducts.forEach(category => {
        if (category.products && category.products.length > 0) {
          // Sort products by revenue and get top 5
          const topProducts = [...category.products]
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);
          
          topProducts.forEach(product => {
            labels.push(`${product.name} (${category.name})`);
            productsData.push(product.revenue);
            allProducts.push(product);
          });
        }
      });
      
      // Generate colors for all products
      for (let i = 0; i < allProducts.length; i++) {
        const hue = (i * 360 / allProducts.length) % 360;
        colors.push(`hsl(${hue}, 70%, 60%)`);
      }
      
      // Display top 20 products if there are more than that
      const maxProducts = 20;
      if (labels.length > maxProducts) {
        labels.splice(maxProducts);
        productsData.splice(maxProducts);
        colors.splice(maxProducts);
      }
      
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Revenue by Product (₹)',
            data: productsData,
            backgroundColor: colors,
            borderColor: colors.map(color => color.replace('60%', '50%')),
            borderWidth: 1
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return '₹' + value;
                }
              }
            },
            y: {
              ticks: {
                callback: function(value, index) {
                  const label = this.getLabelForValue(value);
                  // Truncate long product names
                  return label.length > 25 ? label.substr(0, 23) + '...' : label;
                }
              }
            }
          },
          plugins: {
            tooltip: {
              callbacks: {
                label: function(context) {
                  return `Revenue: ₹${context.raw.toFixed(2)}`;
                },
                title: function(tooltipItems) {
                  return tooltipItems[0].label;
                }
              }
            },
            legend: {
              display: false
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
    <div className="h-[500px]">
      <canvas ref={chartRef}></canvas>
    </div>
  );
};
