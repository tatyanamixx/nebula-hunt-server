const packageTemplateService = require("../../service/package-template-service");
const { PackageTemplate } = require("../../models/models");

// Mock models
jest.mock("../../models/models");

describe("PackageTemplateService - New Format", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	describe("getAllTemplates with filters", () => {
		it("should filter templates by category", async () => {
			const mockTemplates = [
				{
					id: 1,
					slug: "test1",
					category: "resourcePurchase",
					actionType: "fixedAmount",
					actionTarget: "reward",
					actionData: { resource: "stardust", amount: 1000 },
					costData: { price: 99, currency: "tgStars" },
					status: true,
					sortOrder: 1,
					get: jest.fn().mockReturnValue({
						plain: () => ({
							id: 1,
							slug: "test1",
							category: "resourcePurchase",
							actionType: "fixedAmount",
							actionTarget: "reward",
							actionData: { resource: "stardust", amount: 1000 },
							costData: { price: 99, currency: "tgStars" },
							status: true,
							sortOrder: 1,
						}),
					}),
				},
			];

			PackageTemplate.findAll.mockResolvedValue(mockTemplates);

			const result = await packageTemplateService.getAllTemplates({
				category: "resourcePurchase",
			});

			expect(PackageTemplate.findAll).toHaveBeenCalledWith({
				where: { status: true, category: "resourcePurchase" },
				order: [["sortOrder", "ASC"]],
			});

			expect(result).toHaveLength(1);
			expect(result[0].category).toBe("resourcePurchase");
			expect(result[0].actionType).toBe("fixedAmount");
			expect(result[0].actionData).toEqual({
				resource: "stardust",
				amount: 1000,
			});
			expect(result[0].costData).toEqual({ price: 99, currency: "tgStars" });
		});

		it("should filter templates by actionType", async () => {
			const mockTemplates = [
				{
					id: 2,
					slug: "test2",
					category: "gameObject",
					actionType: "updateField",
					actionTarget: "entity",
					actionData: { table: "galaxy", field: "name" },
					costData: { price: 99, currency: "tgStars" },
					status: true,
					sortOrder: 2,
					get: jest.fn().mockReturnValue({
						plain: () => ({
							id: 2,
							slug: "test2",
							category: "gameObject",
							actionType: "updateField",
							actionTarget: "entity",
							actionData: { table: "galaxy", field: "name" },
							costData: { price: 99, currency: "tgStars" },
							status: true,
							sortOrder: 2,
						}),
					}),
				},
			];

			PackageTemplate.findAll.mockResolvedValue(mockTemplates);

			const result = await packageTemplateService.getAllTemplates({
				actionType: "updateField",
			});

			expect(PackageTemplate.findAll).toHaveBeenCalledWith({
				where: { status: true, actionType: "updateField" },
				order: [["sortOrder", "ASC"]],
			});

			expect(result).toHaveLength(1);
			expect(result[0].actionType).toBe("updateField");
			expect(result[0].category).toBe("gameObject");
		});

		it("should return legacy fields for backward compatibility", async () => {
			const mockTemplates = [
				{
					id: 3,
					slug: "test3",
					category: "resourcePurchase",
					actionType: "fixedAmount",
					actionTarget: "reward",
					actionData: { resource: "stardust", amount: 5000 },
					costData: { price: 199, currency: "tgStars" },
					// Legacy fields
					amount: 5000,
					resource: "stardust",
					price: 199.0,
					currency: "tgStars",
					status: true,
					sortOrder: 3,
					get: jest.fn().mockReturnValue({
						plain: () => ({
							id: 3,
							slug: "test3",
							category: "resourcePurchase",
							actionType: "fixedAmount",
							actionTarget: "reward",
							actionData: { resource: "stardust", amount: 5000 },
							costData: { price: 199, currency: "tgStars" },
							// Legacy fields
							amount: 5000,
							resource: "stardust",
							price: 199.0,
							currency: "tgStars",
							status: true,
							sortOrder: 3,
						}),
					}),
				},
			];

			PackageTemplate.findAll.mockResolvedValue(mockTemplates);

			const result = await packageTemplateService.getAllTemplates();

			expect(result).toHaveLength(1);
			expect(result[0].amount).toBe(5000);
			expect(result[0].resource).toBe("stardust");
			expect(result[0].price).toBe(199.0);
			expect(result[0].currency).toBe("tgStars");
		});
	});
});
