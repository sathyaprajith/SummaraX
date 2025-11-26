import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useTheme } from '../context/ThemeContext';
import './MindMapView.css';

const MindMapView = ({ data }) => {
  const { isDarkMode } = useTheme();
  const { nodes = [], edges = [] } = data || {};

  // Calculate positions using a hierarchical layout
  const getNodePosition = (node, index, allNodes) => {
    const level = node.level || 0;
    const nodesAtLevel = allNodes.filter(n => (n.level || 0) === level);
    const indexAtLevel = nodesAtLevel.findIndex(n => n.id === node.id);
    
    // Root node (level 0) - center
    if (level === 0) {
      return { x: 400, y: 50 };
    }
    
    // Calculate spread based on level
    const levelWidth = 800;
    const spacing = levelWidth / (nodesAtLevel.length + 1);
    const x = spacing * (indexAtLevel + 1) - 100;
    const y = 100 + level * 140;
    
    return { x, y };
  };

  // Transform data to ReactFlow format
  const flowNodes = useMemo(() => {
    if (!nodes || nodes.length === 0) return [];
    
    return nodes.map((node, index) => {
      const position = getNodePosition(node, index, nodes);
      const level = node.level || 0;
      
      // Different styles based on level (like the image)
      let nodeStyle = {
        padding: '10px 16px',
        borderRadius: 8,
        fontSize: level === 0 ? 16 : 14,
        fontWeight: level === 0 ? 600 : 500,
        minWidth: level === 0 ? 220 : 180,
        textAlign: 'center',
        border: `1px solid ${isDarkMode ? '#4a5568' : '#cbd5e0'}`,
        background: isDarkMode 
          ? (level === 0 ? '#2d3748' : '#374151')
          : (level === 0 ? '#f7fafc' : '#ffffff'),
        color: isDarkMode ? '#e2e8f0' : '#1a202c',
        boxShadow: isDarkMode 
          ? '0 2px 8px rgba(0,0,0,0.3)'
          : '0 2px 8px rgba(0,0,0,0.08)',
      };

      return {
        id: String(node.id),
        data: { 
          label: (
            <div className="node-content">
              <div className="node-label">{node.label || `Node ${index + 1}`}</div>
              {node.citations && node.citations.length > 0 && (
                <div className="node-citations">
                  {node.citations.map((citation, i) => (
                    <span key={i} className="citation-badge">
                      {citation.file || `Source ${i + 1}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        },
        position,
        style: nodeStyle,
        type: level === 0 ? 'input' : 'default',
      };
    });
  }, [nodes, isDarkMode]);

  const flowEdges = useMemo(() => {
    if (!edges || edges.length === 0) return [];
    
    return edges.map((edge, index) => ({
      id: edge.id || `edge-${edge.source}-${edge.target}-${index}`,
      source: String(edge.source),
      target: String(edge.target),
      label: edge.label || '',
      type: 'smoothstep',
      animated: false,
      style: {
        stroke: isDarkMode ? '#64748b' : '#94a3b8',
        strokeWidth: 1.5,
      },
      labelStyle: {
        fill: isDarkMode ? '#cbd5e0' : '#475569',
        fontSize: 11,
        fontWeight: 500,
      },
      labelBgStyle: {
        fill: isDarkMode ? '#1e293b' : '#f1f5f9',
        fillOpacity: 0.9,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        width: 16,
        height: 16,
        color: isDarkMode ? '#64748b' : '#94a3b8',
      },
    }));
  }, [edges, isDarkMode]);

  const [rfNodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [rfEdges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Update nodes when data changes
  React.useEffect(() => {
    setNodes(flowNodes);
  }, [flowNodes, setNodes]);

  React.useEffect(() => {
    setEdges(flowEdges);
  }, [flowEdges, setEdges]);

  if (!nodes || nodes.length === 0) {
    return (
      <div className={`mindmap-empty ${isDarkMode ? 'dark' : 'light'}`}>
        <div className="empty-icon">🗺️</div>
        <p>No mind map data generated</p>
      </div>
    );
  }

  return (
    <div className={`mindmap-container ${isDarkMode ? 'dark' : 'light'}`}>
      <div className="mindmap-header">
        <h3>📊 Mind Map</h3>
        <div className="mindmap-stats">
          <span className="stat-badge">{nodes.length} concepts</span>
          <span className="stat-badge">{edges.length} relations</span>
        </div>
      </div>
      <div className="mindmap-canvas">
        <ReactFlow
          nodes={rfNodes}
          edges={rfEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          fitView
          attributionPosition="bottom-left"
          minZoom={0.2}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 0.8 }}
        >
          <Background 
            gap={20} 
            size={1}
            color={isDarkMode ? '#2d3748' : '#e2e8f0'}
          />
          <Controls 
            style={{
              background: isDarkMode ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#4a5568' : '#cbd5e0'}`,
            }}
          />
          <MiniMap
            nodeColor={isDarkMode ? '#4a5568' : '#cbd5e0'}
            maskColor={isDarkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.1)'}
            style={{
              background: isDarkMode ? '#1e293b' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#4a5568' : '#cbd5e0'}`,
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default MindMapView;
