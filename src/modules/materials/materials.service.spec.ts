import { describe, it, expect, beforeEach, vi } from "vitest";
import { MaterialsService } from "./materials.service.js";
import { MaterialsRepository } from "../../repositories/materials.repository.js";
import { LaboratoryRepository } from "../../repositories/laboratory.repository.js";
import { IdentityRepository } from "../../repositories/identity.repository.js";

describe("MaterialsService", () => {
  let service: MaterialsService;
  let materialsRepo: Partial<MaterialsRepository>;
  let labRepo: Partial<LaboratoryRepository>;
  let identityRepo: Partial<IdentityRepository>;

  beforeEach(() => {
    materialsRepo = {
      findAllMaterials: vi.fn().mockResolvedValue({
        data: [
          {
            id: "mat-1",
            name: "Etanol 96%",
            ownerType: "LAB",
            labId: "lab-1",
            quantity: "500",
            unit: "ml",
            isMonitored: true,
            labName: "Lab Kimia Dasar",
          },
        ],
        total: 1,
      }),
      findMaterialById: vi.fn().mockResolvedValue({
        id: "mat-1",
        name: "Etanol 96%",
        ownerType: "LAB",
        labId: "lab-1",
        quantity: "500",
        unit: "ml",
        isMonitored: true,
      }),
      createMaterial: vi.fn().mockResolvedValue({
        id: "mat-2",
        name: "Asam Asetat",
        ownerType: "LAB",
        labId: "lab-1",
        quantity: "100",
        unit: "ml",
      }),
      updateMaterial: vi.fn().mockResolvedValue({
        id: "mat-1",
        name: "Etanol 96%",
        quantity: "450",
      }),
      deleteMaterial: vi.fn().mockResolvedValue(true),
    };

    labRepo = {
      findLabById: vi.fn().mockResolvedValue({ id: "lab-1", name: "Lab Kimia Dasar", managers: [] }),
      isManager: vi.fn().mockResolvedValue(true),
    };

    identityRepo = {
      findLecturerByUserId: vi.fn().mockResolvedValue({ id: "lec-1", name: "Dr. Budi" }),
    };

    service = new MaterialsService(
      materialsRepo as MaterialsRepository,
      labRepo as LaboratoryRepository,
      identityRepo as IdentityRepository,
    );
  });

  it("should return paginated materials list", async () => {
    const result = await service.getMaterials({ page: 1, limit: 10 });
    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe("Etanol 96%");
    expect(result.meta.total).toBe(1);
  });

  it("should return material by id", async () => {
    const mat = await service.getMaterialById("mat-1");
    expect(mat).toBeDefined();
    expect(mat.name).toBe("Etanol 96%");
  });

  it("should enforce labId requirement when ownerType is LAB", async () => {
    await expect(
      service.createMaterial(
        {
          name: "Etanol",
          ownerType: "LAB",
          quantity: "100",
          unit: "ml",
        },
        "user-1",
        "ADMIN",
      ),
    ).rejects.toThrow("labId is required when ownerType is LAB");
  });

  it("should create material when valid", async () => {
    const res = await service.createMaterial(
      {
        name: "Asam Asetat",
        ownerType: "LAB",
        labId: "lab-1",
        quantity: "100",
        unit: "ml",
      },
      "user-1",
      "ADMIN",
    );
    expect(res).toBeDefined();
    expect(res.name).toBe("Asam Asetat");
  });

  it("should delete material", async () => {
    const res = await service.deleteMaterial("mat-1");
    expect(res.success).toBe(true);
  });
});
