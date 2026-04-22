/**
 * 图层路由
 */

import { Router } from 'express';
import { LayerController } from '../controllers/layer.controller';

const router = Router();
const controller = new LayerController();

/**
 * GET /api/layers/:fileId
 * 获取文件的图层信息
 */
router.get('/:fileId', (req, res) => controller.getLayers(req, res));

/**
 * PUT /api/layers/:fileId/:layerName
 * 更新图层属性
 */
router.put('/:fileId/:layerName', (req, res) => controller.updateLayer(req, res));

export const layerRouter = router;
