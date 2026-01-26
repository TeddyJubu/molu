"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { bangladeshPhoneRegex } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const deliverySchema = z.object({
  customer_name: z.string().min(2, "Name required"),
  customer_phone: z.string().regex(bangladeshPhoneRegex, "Valid BD phone required (+880XXXXXXXXX)"),
  customer_email: z.string().email("Valid email required"),
  customer_address: z.string().min(5, "Address required"),
  customer_district: z.string().min(1, "District required"),
  special_instructions: z.string().optional()
});

export type DeliveryFormData = z.infer<typeof deliverySchema>;

const deliveryBaseDefaults: DeliveryFormData = {
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  customer_address: "",
  customer_district: "",
  special_instructions: ""
};

export interface DeliveryFormProps {
  onSubmit: (data: DeliveryFormData) => void;
  defaultValues?: Partial<DeliveryFormData>;
  onDraftChange?: (data: Partial<DeliveryFormData>) => void;
  isLoading?: boolean;
}

export function DeliveryForm({ onSubmit, isLoading, defaultValues, onDraftChange }: DeliveryFormProps) {
  const form = useForm<DeliveryFormData>({
    resolver: zodResolver(deliverySchema),
    defaultValues: { ...deliveryBaseDefaults, ...(defaultValues ?? {}) }
  });

  useEffect(() => {
    if (!defaultValues) return;
    if (form.formState.isDirty) return;
    form.reset({ ...deliveryBaseDefaults, ...defaultValues });
  }, [defaultValues, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="customer_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="John Doe"
                  autoComplete="name"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    onDraftChange?.(form.getValues());
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="customer_phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+88017..."
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onDraftChange?.(form.getValues());
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="customer_email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="you@example.com"
                    type="email"
                    autoComplete="email"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onDraftChange?.(form.getValues());
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="customer_district"
          render={({ field }) => (
            <FormItem>
              <FormLabel>District</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value);
                  onDraftChange?.(form.getValues());
                }}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Dhaka">Dhaka</SelectItem>
                  <SelectItem value="Chattogram">Chattogram</SelectItem>
                  <SelectItem value="Sylhet">Sylhet</SelectItem>
                  <SelectItem value="Khulna">Khulna</SelectItem>
                  <SelectItem value="Barishal">Barishal</SelectItem>
                  <SelectItem value="Rajshahi">Rajshahi</SelectItem>
                  <SelectItem value="Rangpur">Rangpur</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="customer_address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Delivery Address</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Street address, building, flat number"
                  autoComplete="street-address"
                  className="min-h-[100px]"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    onDraftChange?.(form.getValues());
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="special_instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Special Instructions (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any special requests?"
                  className="min-h-[80px]"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    onDraftChange?.(form.getValues());
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Processing..." : "Continue to Payment"}
        </Button>
      </form>
    </Form>
  );
}
