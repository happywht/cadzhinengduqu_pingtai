import fs from 'fs';
import path from 'path';
import { DxfParser } from 'dxf-parser';
import prisma from '../utils/database.js';
import { storageService } from './StorageService.js';
import logger from '../utils/logger.js';

export class CADService {
  // 解析CAD文件（简化版本）
  async parseCADFile(filePath: string): Promise<{
    layers: any[];
    entities: any[];
    metadata: any;
  }> {
    try {
      // 这是一个简化的实现
      // 实际项目中，你需要使用专门的CAD解析库，如：
      // - dxf-parser (用于DXF文件)
      // - Open Design Alliance (用于DWG文件，商业库)
      // - LibreCAD (开源库)

      const fileExt = path.extname(filePath).toLowerCase();

      if (fileExt === '.dxf') {
        return this.parseDXFFile(filePath);
      } else if (fileExt === '.dwg') {
        return this.parseDWGFile(filePath);
      } else {
        throw new Error('不支持的文件格式');
      }
    } catch (error) {
      logger.error('CAD文件解析失败:', error);
      throw new Error('CAD文件解析失败');
    }
  }

  // 解析DXF文件
  private async parseDXFFile(filePath: string): Promise<any> {
    try {
      // 读取文件内容
      const content = await fs.promises.readFile(filePath, 'utf-8');

      // 使用dxf-parser解析
      const parser = new DxfParser();
      const dxfData = parser.parseSync(content);

      if (!dxfData) {
        throw new Error('DXF解析失败');
      }

      // 提取图层信息
      const layers = this.extractLayersFromDXF(dxfData);

      // 提取实体信息
      const entities = this.extractEntitiesFromDXF(dxfData);

      // 计算边界框
      const bounds = this.calculateBounds(entities);

      return {
        layers,
        entities,
        bounds,
        metadata: {
          format: 'DXF',
          version: dxfData.header?.version || 'Unknown'
        }
      };
    } catch (error) {
      logger.error('DXF文件解析失败:', error);
      throw new Error(`DXF解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 解析DWG文件
  private async parseDWGFile(filePath: string): Promise<any> {
    // DWG是专有格式，需要专门的库
    // 这里返回简化信息
    return {
      layers: [],
      entities: [],
      metadata: {
        format: 'DWG',
        version: 'Unknown',
        note: 'DWG解析需要专门的商业库'
      }
    };
  }

  // 从DXF数据中提取图层
  private extractLayersFromDXF(dxfData: any): any[] {
    const layers: any[] = [];
    const layerTable = dxfData.tables?.layer?.layers;

    if (!layerTable) {
      // 如果没有图层表，返回默认图层
      return [{
        name: '0',
        color: 7,
        lineType: 'CONTINUOUS',
        visible: true,
        frozen: false
      }];
    }

    // 遍历图层表
    for (const [layerName, layerData] of Object.entries(layerTable)) {
      const layer = layerData as any;
      layers.push({
        name: layerName,
        color: layer.color || 7,
        lineType: layer.lineType || 'CONTINUOUS',
        visible: true,
        frozen: false
      });
    }

    return layers;
  }

  // 从DXF数据中提取实体
  private extractEntitiesFromDXF(dxfData: any): any[] {
    const entities: any[] = [];
    const dxfEntities = dxfData.entities || [];

    for (const dxfEntity of dxfEntities) {
      try {
        const entity = this.parseEntity(dxfEntity);
        if (entity) {
          entities.push(entity);
        }
      } catch (error) {
        logger.warn('实体解析失败:', dxfEntity.type, error);
      }
    }

    return entities;
  }

  // 解析单个实体
  private parseEntity(dxfEntity: any): any | null {
    const baseEntity = {
      layer: dxfEntity.layer || '0',
      color: dxfEntity.color,
      lineType: dxfEntity.lineType
    };

    switch (dxfEntity.type) {
      case 'LINE':
        return {
          type: 'LINE',
          ...baseEntity,
          startPoint: { x: dxfEntity.vertices[0]?.x || 0, y: dxfEntity.vertices[0]?.y || 0 },
          endPoint: { x: dxfEntity.vertices[1]?.x || 0, y: dxfEntity.vertices[1]?.y || 0 },
          vertices: dxfEntity.vertices?.map((v: any) => ({ x: v.x, y: v.y })) || []
        };

      case 'CIRCLE':
        return {
          type: 'CIRCLE',
          ...baseEntity,
          center: { x: dxfEntity.center.x, y: dxfEntity.center.y },
          radius: dxfEntity.radius
        };

      case 'ARC':
        return {
          type: 'ARC',
          ...baseEntity,
          center: { x: dxfEntity.center.x, y: dxfEntity.center.y },
          radius: dxfEntity.radius,
          startAngle: dxfEntity.startAngle,
          endAngle: dxfEntity.endAngle
        };

      case 'TEXT':
      case 'MTEXT':
        return {
          type: 'TEXT',
          ...baseEntity,
          text: dxfEntity.text || '',
          position: { x: dxfEntity.position?.x || 0, y: dxfEntity.position?.y || 0 },
          height: dxfEntity.height || 1
        };

      case 'LWPOLYLINE':
      case 'POLYLINE':
        return {
          type: dxfEntity.type === 'LWPOLYLINE' ? 'LWPOLYLINE' : 'POLYLINE',
          ...baseEntity,
          vertices: dxfEntity.vertices?.map((v: any) => ({ x: v.x, y: v.y })) || [],
          closed: dxfEntity.shape || dxfEntity.closed || false
        };

      case 'POINT':
        return {
          type: 'POINT',
          ...baseEntity,
          position: { x: dxfEntity.position.x, y: dxfEntity.position.y }
        };

      case 'ELLIPSE':
        return {
          type: 'ELLIPSE',
          ...baseEntity,
          center: { x: dxfEntity.center.x, y: dxfEntity.center.y },
          startPoint: { x: dxfEntity.startPoint?.x || 0, y: dxfEntity.startPoint?.y || 0 },
          endPoint: { x: dxfEntity.endPoint?.x || 0, y: dxfEntity.endPoint?.y || 0 }
        };

      case 'SPLINE':
        return {
          type: 'SPLINE',
          ...baseEntity,
          controlPoints: dxfEntity.controlPoints?.map((p: any) => ({ x: p.x, y: p.y })) || []
        };

      case 'SOLID':
      case '3DFACE':
        return {
          type: dxfEntity.type,
          ...baseEntity,
          vertices: dxfEntity.vertices?.map((v: any) => ({ x: v.x, y: v.y })) || []
        };

      default:
        // 不支持的实体类型
        logger.debug('不支持的实体类型:', dxfEntity.type);
        return null;
    }
  }

  // 计算边界框
  private calculateBounds(entities: any[]): any {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const entity of entities) {
      const points = this.extractEntityPoints(entity);

      for (const point of points) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }
    }

    // 如果没有有效坐标，返回默认边界
    if (minX === Infinity) {
      return {
        minX: 0,
        minY: 0,
        maxX: 100,
        maxY: 100,
        width: 100,
        height: 100
      };
    }

    return {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY
    };
  }

  // 提取实体的所有坐标点
  private extractEntityPoints(entity: any): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [];

    switch (entity.type) {
      case 'LINE':
        if (entity.startPoint) points.push(entity.startPoint);
        if (entity.endPoint) points.push(entity.endPoint);
        break;

      case 'CIRCLE':
      case 'ARC':
        if (entity.center && entity.radius) {
          points.push(entity.center);
          points.push({ x: entity.center.x + entity.radius, y: entity.center.y });
          points.push({ x: entity.center.x, y: entity.center.y + entity.radius });
          points.push({ x: entity.center.x - entity.radius, y: entity.center.y });
          points.push({ x: entity.center.x, y: entity.center.y - entity.radius });
        }
        break;

      case 'TEXT':
        if (entity.position) points.push(entity.position);
        break;

      case 'POLYLINE':
      case 'LWPOLYLINE':
        if (entity.vertices) {
          points.push(...entity.vertices);
        }
        break;

      case 'POINT':
        if (entity.position) points.push(entity.position);
        break;

      case 'ELLIPSE':
        if (entity.startPoint) points.push(entity.startPoint);
        if (entity.endPoint) points.push(entity.endPoint);
        break;

      case 'SPLINE':
        if (entity.controlPoints) {
          points.push(...entity.controlPoints);
        }
        break;

      case 'SOLID':
      case '3DFACE':
        if (entity.vertices) {
          points.push(...entity.vertices);
        }
        break;
    }

    return points;
  }

  // 将CAD分割为图像块
  async splitIntoChunks(filePath: string, chunkSize: number = 10): Promise<string[]> {
    // 简化实现：返回模拟的图像URL
    // 实际项目中需要：
    // 1. 将CAD转换为图像
    // 2. 根据图纸大小分块
    // 3. 保存每个块为图像文件

    const chunkUrls: string[] = [];

    // 模拟生成分块图像
    for (let i = 0; i < chunkSize; i++) {
      const chunkFilename = `chunk-${Date.now()}-${i}.png`;
      chunkUrls.push(`/uploads/chunks/${chunkFilename}`);
    }

    return chunkUrls;
  }

  // 保存CAD文件到数据库
  async saveCADFile(
    projectId: string,
    filename: string,
    originalName: string,
    filePath: string,
    fileSize: number,
    fileType: string
  ): Promise<any> {
    try {
      // 解析CAD文件
      const parsedData = await this.parseCADFile(filePath);

      // 保存到数据库
      const cadFile = await prisma.cADFile.create({
        data: {
          projectId,
          filename,
          originalName,
          filePath,
          fileSize,
          fileType,
          parsedData,
          layers: parsedData.layers
        }
      });

      logger.info(`CAD文件保存成功: ${cadFile.id}`);
      return cadFile;
    } catch (error) {
      logger.error('CAD文件保存失败:', error);
      throw new Error('CAD文件保存失败');
    }
  }

  // 获取CAD文件信息
  async getCADFile(fileId: string): Promise<any> {
    const cadFile = await prisma.cADFile.findUnique({
      where: { id: fileId },
      include: {
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!cadFile) {
      throw new Error('CAD文件不存在');
    }

    return cadFile;
  }

  // 获取CAD文件图层
  async getLayers(fileId: string): Promise<any[]> {
    const cadFile = await prisma.cADFile.findUnique({
      where: { id: fileId },
      select: { layers: true }
    });

    if (!cadFile) {
      throw new Error('CAD文件不存在');
    }

    return cadFile.layers || [];
  }

  // 删除CAD文件
  async deleteCADFile(fileId: string): Promise<void> {
    const cadFile = await prisma.cADFile.findUnique({
      where: { id: fileId }
    });

    if (!cadFile) {
      throw new Error('CAD文件不存在');
    }

    // 删除物理文件
    await storageService.deleteFile(cadFile.filePath);

    // 删除数据库记录（级联删除相关配置和任务）
    await prisma.cADFile.delete({
      where: { id: fileId }
    });

    logger.info(`CAD文件删除成功: ${fileId}`);
  }

  // 获取项目下的所有CAD文件
  async getProjectCADFiles(projectId: string): Promise<any[]> {
    return await prisma.cADFile.findMany({
      where: { projectId },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const cadService = new CADService();
