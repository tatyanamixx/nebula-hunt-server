const express = require("express");
const router = express.Router();
const adminAuthMiddleware = require("../middlewares/admin-auth-middleware.js");

const {
	createCommissionTemplates,
	getAllCommissionTemplates,
	getCommissionTemplate,
	updateCommissionTemplate,
	deleteCommissionTemplate,
	getCommissionTemplatesStats,
} = require("../controllers/commission-template-controller.js");

router.use(adminAuthMiddleware);

// GET /api/commission-templates - Get all commission templates
router.get("/", getAllCommissionTemplates);

// GET /api/commission-templates/stats - Get commission templates statistics
router.get("/stats", getCommissionTemplatesStats);

// GET /api/commission-templates/:currency - Get specific commission template
router.get("/:currency", getCommissionTemplate);

// POST /api/commission-templates - Create commission templates
router.post("/", createCommissionTemplates);

// PUT /api/commission-templates/:currency - Update commission template
router.put("/:currency", updateCommissionTemplate);

// DELETE /api/commission-templates/:currency - Delete commission template
router.delete("/:currency", deleteCommissionTemplate);

module.exports = router;
