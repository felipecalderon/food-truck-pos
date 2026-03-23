"use server";

import { revalidatePath } from "next/cache";
import connectDB from "@/lib/db";
import PosProductVisibilityModel from "@/models/PosProductVisibility";

export type PosProductVisibility = {
  externalSku: string;
  showInPos: boolean;
  posLabel?: string | null;
};

export async function getPosProductVisibilityMap(): Promise<
  Record<string, PosProductVisibility>
> {
  try {
    await connectDB();
    const rows = await PosProductVisibilityModel.find({}).lean();

    return rows.reduce<Record<string, PosProductVisibility>>((acc, row) => {
      acc[row.externalSku] = {
        externalSku: row.externalSku,
        showInPos: row.showInPos,
        posLabel: row.posLabel ?? null,
      };
      return acc;
    }, {});
  } catch (error) {
    console.error("Error fetching POS product visibility map:", error);
    return {};
  }
}

export async function savePosProductVisibility(input: {
  externalSku: string;
  showInPos: boolean;
  posLabel?: string | null;
}) {
  try {
    const externalSku = input.externalSku.trim();
    if (!externalSku) {
      return {
        success: false,
        message: "El SKU externo es obligatorio.",
      };
    }

    await connectDB();

    const result = await PosProductVisibilityModel.findOneAndUpdate(
      { externalSku },
      {
        externalSku,
        showInPos: input.showInPos,
        posLabel: input.posLabel?.trim() || null,
      },
      { upsert: true, new: true },
    );

    revalidatePath("/");
    revalidatePath("/admin/products");

    return {
      success: true,
      message: input.showInPos
        ? "Producto visible en POS actualizado correctamente."
        : "Producto oculto en POS actualizado correctamente.",
      data: JSON.parse(JSON.stringify(result)),
    };
  } catch (error) {
    console.error("Error saving POS product visibility:", error);
    return {
      success: false,
      message: "No se pudo guardar la visibilidad del producto en POS.",
    };
  }
}

export async function savePosProductVisibilityBatch(
  inputs: Array<{
    externalSku: string;
    showInPos: boolean;
    posLabel?: string | null;
  }>,
) {
  try {
    await connectDB();

    const normalizedInputs = inputs
      .map((input) => ({
        externalSku: input.externalSku.trim(),
        showInPos: input.showInPos,
        posLabel: input.posLabel?.trim() || null,
      }))
      .filter((input) => input.externalSku.length > 0);

    await Promise.all(
      normalizedInputs.map((input) =>
        PosProductVisibilityModel.findOneAndUpdate(
          { externalSku: input.externalSku },
          {
            externalSku: input.externalSku,
            showInPos: input.showInPos,
            posLabel: input.posLabel,
          },
          { upsert: true, new: true },
        ),
      ),
    );

    revalidatePath("/");
    revalidatePath("/admin/products");

    return {
      success: true,
      message: "Cambios de POS guardados correctamente.",
      updatedCount: normalizedInputs.length,
    };
  } catch (error) {
    console.error("Error saving POS product visibility batch:", error);
    return {
      success: false,
      message: "No se pudieron guardar los cambios masivos de POS.",
      updatedCount: 0,
    };
  }
}
