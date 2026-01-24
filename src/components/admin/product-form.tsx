"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { createProductAction, getProductVariantConfigurationAction, updateProductDetailsAction } from "@/app/admin/_actions";
import { toast } from "sonner";

const formSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((value) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) && parsed >= 0;
    }, "Price must be a valid number"),
  description: z.string().optional(),
  brand: z.string().optional(),
});

type ProductFormValues = z.input<typeof formSchema>;

type OptionDraft = {
  name: string;
  values: string[];
  position?: number | null;
};

type VariantDraft = {
  stock_qty: number;
  options: Record<string, string>;
};

export function ProductForm({
  defaultValues,
  onSuccess
}: {
  defaultValues?: ProductFormValues;
  onSuccess?: () => void;
}) {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: defaultValues || {
      name: "",
      price: "0",
      description: "",
      brand: "",
    },
  });

  const productId = defaultValues?.id ? String(defaultValues.id) : "";

  const [options, setOptions] = useState<OptionDraft[]>([]);
  const [newValueByOption, setNewValueByOption] = useState<Record<number, string>>({});
  const [variants, setVariants] = useState<VariantDraft[]>([{ options: {}, stock_qty: 0 }]);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!productId) return;
      setIsLoadingConfig(true);
      try {
        const config = await getProductVariantConfigurationAction(productId);
        if (cancelled) return;
        setOptions(
          (config.options ?? []).map((o) => ({
            name: o.name,
            values: o.values ?? [],
            position: o.position ?? null
          }))
        );
        setVariants(
          (config.variants ?? []).length
            ? (config.variants ?? []).map((v) => ({ stock_qty: v.stock_qty, options: v.options ?? {} }))
            : [{ options: {}, stock_qty: 0 }]
        );
      } catch (e) {
        if (!cancelled) {
          setOptions([]);
          setVariants([{ options: {}, stock_qty: 0 }]);
        }
      } finally {
        if (!cancelled) setIsLoadingConfig(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const normalizedOptions = options
    .map((o, idx) => ({
      name: o.name.trim().replace(/\s+/g, " "),
      values: (o.values ?? []).map((v) => v.trim().replace(/\s+/g, " ")).filter(Boolean),
      position: o.position ?? idx
    }))
    .filter((o) => o.name.length > 0 && o.values.length > 0);

  const addOption = (name = "") => {
    setOptions((prev) => [...prev, { name, values: [], position: prev.length }]);
  };

  const removeOption = (index: number) => {
    setOptions((prev) => prev.filter((_, i) => i !== index));
    const optionName = options[index]?.name?.trim();
    if (optionName) {
      setVariants((prev) =>
        prev.map((v) => {
          const next = { ...v, options: { ...(v.options ?? {}) } };
          delete next.options[optionName];
          return next;
        })
      );
    }
  };

  const renameOption = (index: number, nextNameRaw: string) => {
    const prevName = options[index]?.name ?? "";
    const nextName = nextNameRaw;
    setOptions((prev) => prev.map((o, i) => (i === index ? { ...o, name: nextName } : o)));
    const prevKey = prevName.trim().replace(/\s+/g, " ");
    const nextKey = nextName.trim().replace(/\s+/g, " ");
    if (!prevKey || !nextKey || prevKey === nextKey) return;
    setVariants((prev) =>
      prev.map((v) => {
        const current = v.options ?? {};
        if (!(prevKey in current)) return v;
        const { [prevKey]: moved, ...rest } = current;
        return { ...v, options: { ...rest, ...(moved ? { [nextKey]: moved } : {}) } };
      })
    );
  };

  const addOptionValue = (index: number) => {
    const nextValue = (newValueByOption[index] ?? "").trim().replace(/\s+/g, " ");
    if (!nextValue) return;
    setOptions((prev) =>
      prev.map((o, i) => {
        if (i !== index) return o;
        const values = o.values ?? [];
        const exists = values.some((v) => v.toLowerCase() === nextValue.toLowerCase());
        if (exists) return o;
        return { ...o, values: [...values, nextValue] };
      })
    );
    setNewValueByOption((prev) => ({ ...prev, [index]: "" }));
  };

  const removeOptionValue = (index: number, value: string) => {
    const optionName = options[index]?.name?.trim().replace(/\s+/g, " ");
    setOptions((prev) =>
      prev.map((o, i) => {
        if (i !== index) return o;
        return { ...o, values: (o.values ?? []).filter((v) => v !== value) };
      })
    );
    if (!optionName) return;
    setVariants((prev) =>
      prev.map((v) => {
        if ((v.options ?? {})[optionName] !== value) return v;
        const next = { ...v, options: { ...(v.options ?? {}) } };
        delete next.options[optionName];
        return next;
      })
    );
  };

  const addVariantRow = () => {
    if (!normalizedOptions.length) {
      setVariants((prev) => [...prev, { options: {}, stock_qty: 0 }]);
      return;
    }
    const options: Record<string, string> = {};
    for (const opt of normalizedOptions) options[opt.name] = "";
    setVariants((prev) => [...prev, { options, stock_qty: 0 }]);
  };

  const removeVariantRow = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const combinationCount = normalizedOptions.reduce((acc, opt) => acc * Math.max(0, opt.values.length), 1);

  const generateVariants = () => {
    if (!normalizedOptions.length) return;
    if (normalizedOptions.some((o) => o.values.length === 0)) return;
    if (combinationCount > 200) {
      toast.error("Too many variants to generate");
      return;
    }

    const order = normalizedOptions.map((o) => o.name);
    const existing = new Set(
      variants.map((v) => order.map((k) => `${k}:${(v.options ?? {})[k] ?? ""}`).join("||"))
    );

    const next: VariantDraft[] = [];
    const build = (idx: number, acc: Record<string, string>) => {
      if (idx >= normalizedOptions.length) {
        const key = order.map((k) => `${k}:${acc[k] ?? ""}`).join("||");
        if (!existing.has(key)) next.push({ options: { ...acc }, stock_qty: 0 });
        return;
      }
      const opt = normalizedOptions[idx]!;
      for (const val of opt.values) {
        acc[opt.name] = val;
        build(idx + 1, acc);
      }
      delete acc[opt.name];
    };
    build(0, {});

    if (!next.length) return;
    setVariants((prev) => [...prev.filter((v) => Object.keys(v.options ?? {}).length > 0), ...next]);
  };

  async function onSubmit(data: ProductFormValues) {
    const formData = new FormData();
    if (data.id) formData.append("id", data.id);
    formData.append("name", data.name);
    formData.append("price", String(Number(data.price)));
    formData.append("description", data.description || "");
    formData.append("brand", data.brand || "");

    const optionsPayload = normalizedOptions.map((o) => ({
      name: o.name,
      values: o.values,
      position: o.position
    }));

    const optionNames = optionsPayload.map((o) => o.name);
    const variantsPayload = variants.map((v) => ({
      options: Object.fromEntries(
        optionNames.map((name) => [name, String((v.options ?? {})[name] ?? "").trim().replace(/\s+/g, " ")])
      ),
      stock_qty: Number(v.stock_qty ?? 0)
    }));

    if (optionsPayload.length) {
      if (!variantsPayload.length) {
        toast.error("Generate variants first");
        return;
      }
      for (const variant of variantsPayload) {
        for (const name of optionNames) {
          if (!variant.options[name]) {
            toast.error("All variants must have values for each attribute");
            return;
          }
        }
        if (!Number.isFinite(variant.stock_qty) || variant.stock_qty < 0) {
          toast.error("Stock must be a non-negative number");
          return;
        }
      }
    } else {
      const only = variantsPayload[0] ?? { options: {}, stock_qty: 0 };
      if (!Number.isFinite(only.stock_qty) || only.stock_qty < 0) {
        toast.error("Stock must be a non-negative number");
        return;
      }
      variantsPayload.splice(0, variantsPayload.length, { options: {}, stock_qty: only.stock_qty });
    }

    formData.append("options", JSON.stringify(optionsPayload));
    formData.append("variants", JSON.stringify(variantsPayload));

    try {
      if (data.id) {
        await updateProductDetailsAction(formData);
        toast.success("Product updated");
      } else {
        await createProductAction(formData);
        toast.success("Product created");
      }
      onSuccess?.();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save product";
      toast.error(message);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Product Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-4">
            <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
                <FormItem className="flex-1">
                <FormLabel>Price</FormLabel>
                <FormControl>
                    <Input type="number" placeholder="0" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
            <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
                <FormItem className="flex-1">
                <FormLabel>Brand</FormLabel>
                <FormControl>
                    <Input placeholder="Brand" {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Product description..." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <div className="text-sm font-medium">Attributes</div>
              <div className="text-xs text-muted-foreground">Add attributes (e.g. Size, Color, Age Range) to create variants.</div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => addOption("Size")}>
                Add Size
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addOption("Color")}>
                Add Color
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addOption("Age Range")}>
                Add Age Range
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addOption("")}>
                Add Custom
              </Button>
            </div>
          </div>

          {isLoadingConfig ? <div className="text-sm text-muted-foreground">Loading attributes…</div> : null}

          {options.length === 0 && !isLoadingConfig ? (
            <div className="rounded border bg-muted/30 p-3 text-sm text-muted-foreground">No attributes yet.</div>
          ) : null}

          {options.map((opt, idx) => (
            <div key={`opt-${idx}`} className="space-y-2 rounded border p-3">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label>Attribute Name</Label>
                  <Input value={opt.name} onChange={(e) => renameOption(idx, e.target.value)} placeholder="e.g. Size" />
                </div>
                <Button type="button" variant="outline" size="icon" onClick={() => removeOption(idx)} aria-label="Remove attribute">
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label>Values</Label>
                <div className="flex flex-wrap gap-2">
                  {(opt.values ?? []).map((value) => (
                    <Badge key={`${idx}-${value}`} variant="secondary" className="gap-1">
                      {value}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeOptionValue(idx, value)} />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newValueByOption[idx] ?? ""}
                    onChange={(e) => setNewValueByOption((prev) => ({ ...prev, [idx]: e.target.value }))}
                    placeholder="Add value (e.g. XL)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addOptionValue(idx);
                      }
                    }}
                  />
                  <Button type="button" size="icon" variant="outline" onClick={() => addOptionValue(idx)} aria-label="Add value">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-3 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-col">
              <div className="text-sm font-medium">Variants</div>
              <div className="text-xs text-muted-foreground">
                {normalizedOptions.length ? `${combinationCount} possible combinations` : "Single default variant (no attributes)."}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateVariants}
                disabled={!normalizedOptions.length || normalizedOptions.some((o) => o.values.length === 0)}
              >
                Generate
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={addVariantRow} disabled={!normalizedOptions.length}>
                Add Row
              </Button>
            </div>
          </div>

          {!normalizedOptions.length ? (
            <div className="rounded border p-3">
              <div className="w-full sm:w-48">
                <Label>Stock Qty</Label>
                <Input
                  type="number"
                  value={String(variants[0]?.stock_qty ?? 0)}
                  onChange={(e) => setVariants([{ options: {}, stock_qty: Number(e.target.value) }])}
                  min={0}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {variants.length === 0 ? <div className="text-sm text-muted-foreground">No variants yet. Click Generate.</div> : null}
              {variants.map((v, idx) => (
                <div key={`var-${idx}`} className="flex flex-col gap-2 rounded border p-3 sm:flex-row sm:items-end">
                  {normalizedOptions.map((opt) => (
                    <div key={`${idx}-${opt.name}`} className="flex-1">
                      <Label>{opt.name}</Label>
                      <Input
                        value={String((v.options ?? {})[opt.name] ?? "")}
                        onChange={(e) =>
                          setVariants((prev) =>
                            prev.map((row, i) =>
                              i === idx ? { ...row, options: { ...(row.options ?? {}), [opt.name]: e.target.value } } : row
                            )
                          )
                        }
                        placeholder={opt.values[0] ? `e.g. ${opt.values[0]}` : "Value"}
                      />
                    </div>
                  ))}
                  <div className="w-full sm:w-32">
                    <Label>Stock</Label>
                    <Input
                      type="number"
                      value={String(v.stock_qty)}
                      onChange={(e) =>
                        setVariants((prev) => prev.map((row, i) => (i === idx ? { ...row, stock_qty: Number(e.target.value) } : row)))
                      }
                      min={0}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" className="text-red-600" onClick={() => removeVariantRow(idx)}>
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit">{defaultValues?.id ? "Update Product" : "Create Product"}</Button>
        </div>
      </form>
    </Form>
  );
}
