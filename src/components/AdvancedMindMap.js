// Advanced Interactive Mind Map with NotebookLM-style features
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
  Panel,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import 'reactflow/dist/style.css';
import { useTheme } from '../context/ThemeContext';
import './AdvancedMindMap.css';

// Node Detail Panel Component
const NodeDetailPanel = ({ node, onClose, onKeywordClick, isDarkMode }) => {
  if (!node) return null;

  return (
    <div className={`node-detail-panel ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="panel-header">
        <h3>{node.label}</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      
      <div className="panel-content">
        {node.summary && (
          <div className="panel-section">
            <h4>📝 Summary</h4>
            <p>{node.summary}</p>
          </div>
        )}
        
        {node.keyPoints && node.keyPoints.length > 0 && (
          <div className="panel-section">
            <h4>🎯 Key Points</h4>
            <ul>
              {node.keyPoints.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>
          </div>
        )}
        
        {node.type && (
          <div className="panel-section">
            <h4>🏷️ Type</h4>
            <span className={`type-badge ${node.type}`}>{node.type}</span>
          </div>
        )}
        
        {node.source && (
          <div className="panel-section">
            <h4>📄 Source</h4>
            <span className="source-badge">{node.source}</span>
          </div>
        )}
        
        {/* Clickable keywords */}
        <div className="panel-section">
          <h4>🔍 Keywords</h4>
          <div className="keyword-chips">
            {extractKeywords(node).map((keyword, idx) => (
              <span 
                key={idx} 
                className="keyword-chip"
                onClick={() => onKeywordClick(keyword)}
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Search Bar Component
const SearchBar = ({ nodes, onNodeSelect, isDarkMode }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const searchTerm = query.toLowerCase();
    const matches = nodes.filter(node => 
      node.label?.toLowerCase().includes(searchTerm) ||
      node.summary?.toLowerCase().includes(searchTerm) ||
      node.keyPoints?.some(point => point.toLowerCase().includes(searchTerm))
    );

    setResults(matches.slice(0, 10));
  }, [query, nodes]);

  return (
    <div className={`search-bar ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="search-input-wrapper">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          placeholder="Search nodes..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="search-input"
        />
        {query && (
          <button className="clear-btn" onClick={() => setQuery('')}>✕</button>
        )}
      </div>
      
      {results.length > 0 && (
        <div className="search-results">
          {results.map(node => (
            <div
              key={node.id}
              className="search-result-item"
              onClick={() => {
                onNodeSelect(node);
                setQuery('');
              }}
            >
              <div className="result-title">{node.label}</div>
              <div className="result-breadcrumb">
                Level {node.level} • {node.type || 'concept'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Floating Toolbar Component
const FloatingToolbar = ({ 
  onResetView, 
  onExpandAll, 
  onCollapseAll, 
  onExport, 
  isDarkMode 
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);

  return (
    <div className={`floating-toolbar ${isDarkMode ? 'dark' : 'light'}`}>
      <button className="toolbar-btn" onClick={onResetView} title="Reset View">
        🎯
      </button>
      <button className="toolbar-btn" onClick={onExpandAll} title="Expand All">
        ➕
      </button>
      <button className="toolbar-btn" onClick={onCollapseAll} title="Collapse All">
        ➖
      </button>
      <div className="toolbar-btn-group">
        <button 
          className="toolbar-btn" 
          onClick={() => setShowExportMenu(!showExportMenu)}
          title="Export"
        >
          💾
        </button>
        {showExportMenu && (
          <div className="export-menu">
            <button onClick={() => { onExport('png'); setShowExportMenu(false); }}>
              🖼️ PNG
            </button>
            <button onClick={() => { onExport('pdf'); setShowExportMenu(false); }}>
              📄 PDF
            </button>
            <button onClick={() => { onExport('json'); setShowExportMenu(false); }}>
              📋 JSON
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Main Advanced Mind Map Component
const AdvancedMindMapInner = ({ data }) => {
  const { isDarkMode } = useTheme();
  const { nodes: initialNodes = [], edges: initialEdges = [], metadata } = data || {};
  
  const reactFlowWrapper = useRef(null);
  const { fitView, zoomTo, setCenter } = useReactFlow();
  
  const [selectedNode, setSelectedNode] = useState(null);
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());
  const [searchHighlight, setSearchHighlight] = useState(null);

  // Transform data to ReactFlow format with positioning
  const transformedData = useMemo(() => {
    return transformToReactFlow(initialNodes, initialEdges, collapsedNodes, isDarkMode);
  }, [initialNodes, initialEdges, collapsedNodes, isDarkMode]);

  const [nodes, setNodes, onNodesChange] = useNodesState(transformedData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(transformedData.edges);

  // Update nodes when data or theme changes
  useEffect(() => {
    const newData = transformToReactFlow(initialNodes, initialEdges, collapsedNodes, isDarkMode);
    setNodes(newData.nodes);
    setEdges(newData.edges);
  }, [initialNodes, initialEdges, collapsedNodes, isDarkMode, setNodes, setEdges]);

  // Handle node click - expand/collapse
  const onNodeClick = useCallback((event, node) => {
    const nodeData = initialNodes.find(n => n.id === node.id);
    if (!nodeData) return;

    // Check if node has children
    const hasChildren = initialEdges.some(e => e.source === node.id);
    
    if (hasChildren) {
      setCollapsedNodes(prev => {
        const newSet = new Set(prev);
        if (newSet.has(node.id)) {
          newSet.delete(node.id);
        } else {
          newSet.add(node.id);
        }
        return newSet;
      });
    }
  }, [initialNodes, initialEdges]);

  // Handle node double-click - show detail panel
  const onNodeDoubleClick = useCallback((event, node) => {
    const nodeData = initialNodes.find(n => n.id === node.id);
    setSelectedNode(nodeData);
  }, [initialNodes]);

  // Handle node hover - highlight branch
  const onNodeMouseEnter = useCallback((event, node) => {
    const related = findRelatedNodes(node.id, initialEdges);
    setHighlightedNodes(related);
  }, [initialEdges]);

  const onNodeMouseLeave = useCallback(() => {
    setHighlightedNodes(new Set());
  }, []);

  // Reset view
  const handleResetView = useCallback(() => {
    fitView({ duration: 800, padding: 0.2 });
  }, [fitView]);

  // Expand all nodes
  const handleExpandAll = useCallback(() => {
    setCollapsedNodes(new Set());
  }, []);

  // Collapse all except root
  const handleCollapseAll = useCallback(() => {
    const allNodes = new Set(initialNodes.filter(n => n.level > 0).map(n => n.id));
    setCollapsedNodes(allNodes);
  }, [initialNodes]);

  // Export functionality
  const handleExport = useCallback(async (format) => {
    if (format === 'json') {
      const dataStr = JSON.stringify({ nodes: initialNodes, edges: initialEdges, metadata }, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `mindmap-${Date.now()}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else if (format === 'png') {
      if (reactFlowWrapper.current) {
        try {
          const dataUrl = await toPng(reactFlowWrapper.current, {
            backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
            width: 1920,
            height: 1080,
          });
          const link = document.createElement('a');
          link.download = `mindmap-${Date.now()}.png`;
          link.href = dataUrl;
          link.click();
        } catch (error) {
          console.error('Export failed:', error);
          alert('Export failed. Please try again.');
        }
      }
    } else if (format === 'pdf') {
      if (reactFlowWrapper.current) {
        try {
          const dataUrl = await toPng(reactFlowWrapper.current, {
            backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
            width: 1920,
            height: 1080,
          });
          const pdf = new jsPDF('landscape', 'px', [1920, 1080]);
          pdf.addImage(dataUrl, 'PNG', 0, 0, 1920, 1080);
          pdf.save(`mindmap-${Date.now()}.pdf`);
        } catch (error) {
          console.error('Export failed:', error);
          alert('Export failed. Please try again.');
        }
      }
    }
  }, [initialNodes, initialEdges, metadata, isDarkMode]);

  // Handle search node selection
  const handleNodeSelect = useCallback((node) => {
    const flowNode = nodes.find(n => n.id === node.id);
    if (flowNode) {
      setCenter(flowNode.position.x, flowNode.position.y, { duration: 800, zoom: 1.5 });
      setSearchHighlight(node.id);
      setTimeout(() => setSearchHighlight(null), 2000);
    }
  }, [nodes, setCenter]);

  // Handle keyword click
  const handleKeywordClick = useCallback((keyword) => {
    const matching = initialNodes.filter(node =>
      node.label?.toLowerCase().includes(keyword.toLowerCase()) ||
      node.summary?.toLowerCase().includes(keyword.toLowerCase())
    );
    
    const matchingIds = new Set(matching.map(n => n.id));
    setHighlightedNodes(matchingIds);
    
    setTimeout(() => setHighlightedNodes(new Set()), 3000);
  }, [initialNodes]);

  if (!initialNodes || initialNodes.length === 0) {
    return (
      <div className={`mindmap-empty ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="empty-icon">🗺️</div>
        <p>No mind map data available</p>
      </div>
    );
  }

  return (
    <div className={`advanced-mindmap-container ${isDarkMode ? 'dark' : 'light'}`} ref={reactFlowWrapper}>
      {/* Header with stats */}
      <div className="mindmap-header">
        <div className="header-left">
          <h3>🗺️ Interactive Mind Map</h3>
          {metadata && (
            <span className="ai-badge">
              Powered by {metadata.aiModel}
            </span>
          )}
        </div>
        <div className="header-stats">
          <span className="stat-badge">{initialNodes.length} concepts</span>
          <span className="stat-badge">{initialEdges.length} connections</span>
          {metadata && (
            <span className="stat-badge">Depth: {metadata.maxDepth}</span>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <SearchBar 
        nodes={initialNodes} 
        onNodeSelect={handleNodeSelect}
        isDarkMode={isDarkMode}
      />

      {/* Floating Toolbar */}
      <FloatingToolbar
        onResetView={handleResetView}
        onExpandAll={handleExpandAll}
        onCollapseAll={handleCollapseAll}
        onExport={handleExport}
        isDarkMode={isDarkMode}
      />

      {/* Node Detail Panel */}
      {selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onKeywordClick={handleKeywordClick}
          isDarkMode={isDarkMode}
        />
      )}

      {/* React Flow Canvas */}
      <div className="mindmap-canvas">
        <ReactFlow
          nodes={nodes.map(node => ({
            ...node,
            data: {
              ...node.data,
              isHighlighted: highlightedNodes.has(node.id) || searchHighlight === node.id,
              isDimmed: highlightedNodes.size > 0 && !highlightedNodes.has(node.id),
            }
          }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          fitView
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.7 }}
          attributionPosition="bottom-left"
        >
          <Background 
            gap={20} 
            size={1}
            color={isDarkMode ? '#1e293b' : '#e2e8f0'}
          />
          <Controls 
            style={{
              background: isDarkMode ? '#0f172a' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#334155' : '#cbd5e0'}`,
            }}
          />
          <MiniMap
            nodeColor={isDarkMode ? '#334155' : '#cbd5e0'}
            maskColor={isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.1)'}
            style={{
              background: isDarkMode ? '#0f172a' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#334155' : '#cbd5e0'}`,
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
};

// Wrapper with ReactFlowProvider
const AdvancedMindMap = (props) => (
  <ReactFlowProvider>
    <AdvancedMindMapInner {...props} />
  </ReactFlowProvider>
);

// Helper: Transform data to ReactFlow format
function transformToReactFlow(nodes, edges, collapsedNodes, isDarkMode) {
  if (!nodes || nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  // Calculate positions using hierarchical layout
  const positioned = calculateHierarchicalLayout(nodes, edges, collapsedNodes);
  
  // Filter out collapsed children
  const visibleNodes = positioned.filter(node => {
    // Always show root
    if (node.level === 0) return true;
    
    // Check if any ancestor is collapsed
    const ancestors = findAncestors(node.id, edges);
    return !ancestors.some(ancestorId => collapsedNodes.has(ancestorId));
  });

  // Transform to ReactFlow format
  const flowNodes = visibleNodes.map(node => ({
    id: node.id,
    type: 'default',
    position: node.position,
    data: {
      label: createNodeLabel(node, isDarkMode),
    },
    style: getNodeStyle(node, isDarkMode),
  }));

  // Filter edges for visible nodes
  const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
  const flowEdges = edges
    .filter(edge => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target))
    .map(edge => ({
      id: edge.id || `${edge.source}-${edge.target}`,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: edge.style === 'dashed' ? 'step' : 'smoothstep',
      animated: false,
      style: {
        stroke: edge.style === 'dashed' 
          ? (isDarkMode ? '#475569' : '#94a3b8')
          : (isDarkMode ? '#64748b' : '#94a3b8'),
        strokeWidth: 2,
        strokeDasharray: edge.style === 'dashed' ? '5,5' : 'none',
      },
      labelStyle: {
        fill: isDarkMode ? '#cbd5e0' : '#475569',
        fontSize: 11,
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: isDarkMode ? '#0f172a' : '#f8fafc',
        fillOpacity: 0.9,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 20,
        height: 20,
        color: isDarkMode ? '#64748b' : '#94a3b8',
      },
    }));

  return { nodes: flowNodes, edges: flowEdges };
}

// Helper: Calculate hierarchical layout
function calculateHierarchicalLayout(nodes, edges, collapsedNodes) {
  const positioned = JSON.parse(JSON.stringify(nodes));
  
  // Group by level
  const levelGroups = {};
  positioned.forEach(node => {
    const level = node.level || 0;
    if (!levelGroups[level]) levelGroups[level] = [];
    levelGroups[level].push(node);
  });

  // Position nodes
  const levelSpacing = 200;
  const nodeSpacing = 250;
  
  Object.keys(levelGroups).forEach(level => {
    const nodesAtLevel = levelGroups[level];
    const totalWidth = nodesAtLevel.length * nodeSpacing;
    const startX = -totalWidth / 2;
    
    nodesAtLevel.forEach((node, index) => {
      node.position = {
        x: startX + index * nodeSpacing + nodeSpacing / 2,
        y: parseInt(level) * levelSpacing + 50,
      };
    });
  });

  return positioned;
}

// Helper: Create node label JSX
function createNodeLabel(node, isDarkMode) {
  const hasChildren = node.children && node.children.length > 0;
  
  return (
    <div className={`custom-node ${node.type || 'concept'}`}>
      <div className="node-title">{node.label}</div>
      {node.source && (
        <div className="node-source">{node.source}</div>
      )}
      {hasChildren && (
        <div className="node-expand-indicator">▼</div>
      )}
    </div>
  );
}

// Helper: Get node style
function getNodeStyle(node, isDarkMode) {
  const typeColors = {
    root: { bg: isDarkMode ? '#1e3a8a' : '#dbeafe', border: isDarkMode ? '#3b82f6' : '#2563eb' },
    concept: { bg: isDarkMode ? '#134e4a' : '#d1fae5', border: isDarkMode ? '#14b8a6' : '#0d9488' },
    definition: { bg: isDarkMode ? '#713f12' : '#fef3c7', border: isDarkMode ? '#f59e0b' : '#d97706' },
    example: { bg: isDarkMode ? '#701a75' : '#fae8ff', border: isDarkMode ? '#c026d3' : '#a21caf' },
    process: { bg: isDarkMode ? '#7c2d12' : '#fed7aa', border: isDarkMode ? '#ea580c' : '#c2410c' },
  };

  const colors = typeColors[node.type] || typeColors.concept;
  const level = node.level || 0;
  const scale = 1 - (level * 0.1);

  return {
    background: colors.bg,
    border: `2px solid ${colors.border}`,
    borderRadius: 12,
    padding: '12px 16px',
    fontSize: Math.max(14 - level, 12),
    fontWeight: level === 0 ? 600 : 500,
    minWidth: 180 * scale,
    boxShadow: isDarkMode 
      ? `0 4px 12px rgba(0,0,0,0.4), 0 0 0 2px ${colors.border}40`
      : `0 4px 12px rgba(0,0,0,0.1), 0 0 0 2px ${colors.border}20`,
    color: isDarkMode ? '#e2e8f0' : '#0f172a',
    transition: 'all 0.3s ease',
  };
}

// Helper: Find related nodes
function findRelatedNodes(nodeId, edges) {
  const related = new Set([nodeId]);
  
  // Find all connected nodes (children and parents)
  edges.forEach(edge => {
    if (edge.source === nodeId) related.add(edge.target);
    if (edge.target === nodeId) related.add(edge.source);
  });

  return related;
}

// Helper: Find ancestors
function findAncestors(nodeId, edges) {
  const ancestors = [];
  let current = nodeId;
  
  while (current) {
    const parentEdge = edges.find(e => e.target === current);
    if (parentEdge) {
      ancestors.push(parentEdge.source);
      current = parentEdge.source;
    } else {
      break;
    }
  }
  
  return ancestors;
}

// Helper: Extract keywords from node
function extractKeywords(node) {
  const text = `${node.label} ${node.summary || ''}`.toLowerCase();
  const words = text.match(/\b[a-z]{4,}\b/g) || [];
  const unique = [...new Set(words)];
  return unique.slice(0, 6);
}

export default AdvancedMindMap;
