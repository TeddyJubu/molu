"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { createProductAction, updateProductDetailsAction } from "@/app/admin/_actions";
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
  sizes: z.array(z.string()).default([]),
  colors: z.array(z.string()).default([]),
});

type ProductFormValues = z.input<typeof formSchema>;

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
      sizes: [],
      colors: [],
    },
  });

  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");

  const addSize = () => {
    if (!newSize.trim()) return;
    const current = form.getValues("sizes") ?? [];
    if (!current.includes(newSize.trim())) {
      form.setValue("sizes", [...current, newSize.trim()]);
    }
    setNewSize("");
  };

  const removeSize = (size: string) => {
    const current = form.getValues("sizes") ?? [];
    form.setValue(
      "sizes",
      current.filter((s) => s !== size)
    );
  };

  const addColor = () => {
    if (!newColor.trim()) return;
    const current = form.getValues("colors") ?? [];
    if (!current.includes(newColor.trim())) {
      form.setValue("colors", [...current, newColor.trim()]);
    }
    setNewColor("");
  };

  const removeColor = (color: string) => {
    const current = form.getValues("colors") ?? [];
    form.setValue(
      "colors",
      current.filter((c) => c !== color)
    );
  };

  async function onSubmit(data: ProductFormValues) {
    const formData = new FormData();
    if (data.id) formData.append("id", data.id);
    formData.append("name", data.name);
    formData.append("price", String(Number(data.price)));
    formData.append("description", data.description || "");
    formData.append("brand", data.brand || "");
    formData.append("sizes", JSON.stringify(data.sizes ?? []));
    formData.append("colors", JSON.stringify(data.colors ?? []));

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
      toast.error("Failed to save product");
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

        <div className="space-y-2">
            <FormLabel>Sizes</FormLabel>
            <div className="flex flex-wrap gap-2 mb-2">
                {(form.watch("sizes") ?? []).map((size) => (
                    <Badge key={size} variant="secondary" className="gap-1">
                        {size}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeSize(size)} />
                    </Badge>
                ))}
            </div>
            <div className="flex gap-2">
                <Input 
                    value={newSize} 
                    onChange={e => setNewSize(e.target.value)} 
                    placeholder="Add size (e.g. XL)"
                    onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); addSize(); } }}
                />
                <Button type="button" size="icon" variant="outline" onClick={addSize}><Plus className="h-4 w-4" /></Button>
            </div>
        </div>

        <div className="space-y-2">
            <FormLabel>Colors</FormLabel>
            <div className="flex flex-wrap gap-2 mb-2">
                {(form.watch("colors") ?? []).map((color) => (
                    <Badge key={color} variant="secondary" className="gap-1">
                        {color}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeColor(color)} />
                    </Badge>
                ))}
            </div>
            <div className="flex gap-2">
                <Input 
                    value={newColor} 
                    onChange={e => setNewColor(e.target.value)} 
                    placeholder="Add color (e.g. Red)"
                    onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); addColor(); } }}
                />
                <Button type="button" size="icon" variant="outline" onClick={addColor}><Plus className="h-4 w-4" /></Button>
            </div>
        </div>

        <div className="flex justify-end gap-2 pt-4">
            <Button type="submit">{defaultValues?.id ? "Update Product" : "Create Product"}</Button>
        </div>
      </form>
    </Form>
  );
}
