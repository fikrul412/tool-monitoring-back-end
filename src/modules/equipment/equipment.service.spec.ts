import { describe, it, expect, beforeEach, vi } from "vitest";
import { EquipmentService } from "./equipment.service.js";
import { EquipmentRepository } from "../../repositories/equipment.repository.js";
import { LaboratoryRepository } from "../../repositories/laboratory.repository.js";
import { IdentityRepository } from "../../repositories/identity.repository.js";

describe("EquipmentService", () => {
  let service: EquipmentService;
  let equipmentRepo: Partial<EquipmentRepository>;
  let labRepo: Partial<LaboratoryRepository>;
  let identityRepo: Partial<IdentityRepository>;

  beforeEach(() => {
    equipmentRepo = {
      findAllTools: vi.fn().mockResolvedValue({
        data: [
          {
            id: "tool-1",
            name: "Mikroskop Binokuler",
            inventoryCode: "INV-001",
            status: "AVAILABLE",
            ownerType: "LAB",
            labId: "lab-1",
            lecturerId: null,
            labName: "Lab Biologi",
            categoryName: "Optik",
            lecturerName: null,
          },
        ],
        total: 1,
      }),
      findToolById: vi.fn().mockResolvedValue({
        id: "tool-1",
        name: "Mikroskop Binokuler",
        inventoryCode: "INV-001",
        status: "AVAILABLE",
        ownerType: "LAB",
        labId: "lab-1",
        lecturerId: null,
        labName: "Lab Biologi",
        categoryName: "Optik",
        lecturerName: null,
      }),
      createTool: vi.fn().mockResolvedValue({
        id: "tool-2",
        name: "Spektrofotometer",
        status: "AVAILABLE",
        ownerType: "LAB",
        labId: "lab-1",
        lecturerId: null,
      }),
      updateTool: vi.fn().mockResolvedValue({
        id: "tool-1",
        name: "Mikroskop Binokuler Updated",
        status: "IN_USE",
      }),
      deleteTool: vi.fn().mockResolvedValue(true),
    };

    labRepo = {
      findLabById: vi.fn().mockResolvedValue({
        id: "lab-1",
        name: "Lab Biologi",
        managers: [],
      }),
      isManager: vi.fn().mockResolvedValue(true),
    };

    identityRepo = {
      findLecturerByUserId: vi.fn().mockResolvedValue({ id: "lec-1", name: "Dr. Budi" }),
    };

    service = new EquipmentService(
      equipmentRepo as EquipmentRepository,
      labRepo as LaboratoryRepository,
      identityRepo as IdentityRepository,
    );
  });

  it("should return paginated tools list", async () => {
    const result = await service.getTools({ page: 1, limit: 10 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe("Mikroskop Binokuler");
    expect(result.meta.total).toBe(1);
  });

  it("should return tool by id", async () => {
    const tool = await service.getToolById("tool-1");
    expect(tool).toBeDefined();
    expect(tool.name).toBe("Mikroskop Binokuler");
  });

  it("should create new tool with LAB ownerType when authorized", async () => {
    const created = await service.createTool(
      {
        name: "Spektrofotometer",
        ownerType: "LAB",
        labId: "lab-1",
        status: "AVAILABLE",
      },
      "user-1",
      "ADMIN",
    );
    expect(created).toBeDefined();
    expect(created.name).toBe("Spektrofotometer");
  });

  it("should enforce labId requirement when ownerType is LAB", async () => {
    await expect(
      service.createTool(
        {
          name: "Test Tool",
          ownerType: "LAB",
          status: "AVAILABLE",
        },
        "user-1",
        "ADMIN",
      ),
    ).rejects.toThrow("labId is required when ownerType is LAB");
  });

  it("should enforce lecturerId requirement when ownerType is LECTURER", async () => {
    await expect(
      service.createTool(
        {
          name: "Test Tool",
          ownerType: "LECTURER",
          status: "AVAILABLE",
        },
        "user-1",
        "ADMIN",
      ),
    ).rejects.toThrow("lecturerId is required when ownerType is LECTURER");
  });

  it("should reject labId when ownerType is LECTURER", async () => {
    await expect(
      service.createTool(
        {
          name: "Test Tool",
          ownerType: "LECTURER",
          lecturerId: "lec-1",
          assignedLabId: "lab-1",
          labId: "lab-1",
          status: "AVAILABLE",
        },
        "user-1",
        "ADMIN",
      ),
    ).rejects.toThrow("labId must not be provided for lecturer-owned equipment");
  });

  it("should create tool with LECTURER ownerType when authorized", async () => {
    (equipmentRepo.createTool as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: "tool-3",
      name: "Alat Dosen",
      status: "AVAILABLE",
      ownerType: "LECTURER",
      labId: null,
      lecturerId: "lec-1",
    });

    const created = await service.createTool(
      {
        name: "Alat Dosen",
        ownerType: "LECTURER",
        lecturerId: "lec-1",
        assignedLabId: "lab-1",
        status: "AVAILABLE",
      },
      "user-1",
      "ADMIN",
    );
    expect(created).toBeDefined();
    expect(created.ownerType).toBe("LECTURER");
  });

  it("should delete tool", async () => {
    const res = await service.deleteTool("tool-1");
    expect(res.success).toBe(true);
  });
});
