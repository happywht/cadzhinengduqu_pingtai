/**
 * CAD相关类型定义
 */

export interface Point2D {
  x: number;
  y: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

export interface CADLayer {
  name: string;
  color: number;
  lineType: string;
  visible: boolean;
  frozen: boolean;
  entityCount: number;
}

export interface CADEntity {
  id: string;
  type: 'LINE' | 'CIRCLE' | 'ARC' | 'TEXT' | 'POLYLINE' | 'LWPOLYLINE' | 'POINT';
  layer: string;
  color: number;
  geometry: any;
}

export interface CADParseResult {
  success: boolean;
  layers: CADLayer[];
  entities: CADEntity[];
  bounds: BoundingBox;
  thumbnail?: string; // base64图片
  metadata: {
    fileName: string;
    fileSize: number;
    parseTime: number;
    version: string;
  };
}

export interface ConvertRequest {
  file_url?: string;
  format?: 'dwg' | 'dxf';
}

export interface ConvertResponse {
  success: boolean;
  data?: CADParseResult;
  error?: string;
  timestamp: string;
}
