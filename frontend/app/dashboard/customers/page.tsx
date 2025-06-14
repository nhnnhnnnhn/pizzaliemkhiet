"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, UserPlus, MoreHorizontal, Award, Eye, Pencil, Trash2 } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useGetAllUsersQuery, useSearchUsersQuery, useDeleteUserMutation, useToggleUserActivationMutation, useAdminUpdateUserProfileMutation, User } from "@/redux/api/userApi"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { getTranslation } from "@/utils/translations"

export default function CustomersPage() {
  const { user } = useAuth()
  const [language, setLanguage] = useState<"en" | "vi">("en")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isConfirmSaveDialogOpen, setIsConfirmSaveDialogOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  })
  const [validationErrors, setValidationErrors] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
  })

  // Fetch customers
  const { 
    data: customers, 
    isLoading, 
    error 
  } = useGetAllUsersQuery()

  // Search functionality using the API
  const { 
    data: searchResults,
    isLoading: isSearching 
  } = useSearchUsersQuery(searchQuery, {
    skip: !searchQuery // Only search when there's a query
  })

  // Mutations
  const [deleteUser] = useDeleteUserMutation()
  const [toggleUserActivation] = useToggleUserActivationMutation()
  const [adminUpdateUserProfile] = useAdminUpdateUserProfileMutation()

  // Update the displayCustomers to use local state
  const displayCustomers = (searchQuery ? searchResults : customers)?.filter(
    (customer: User) => customer.role === 'user'
  )

  // Listen for language changes
  useEffect(() => {
    // Get initial language
    const savedLanguage = localStorage.getItem("language") as "en" | "vi" | null
    if (savedLanguage === "en" || savedLanguage === "vi") {
      setLanguage(savedLanguage)
    }

    // Listen for storage changes (from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "language" && (e.newValue === "en" || e.newValue === "vi")) {
        setLanguage(e.newValue)
      }
    }

    // Listen for custom language change event (from same tab)
    const handleLanguageChange = (e: CustomEvent<"en" | "vi">) => {
      setLanguage(e.detail)
    }

    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("languageChange", handleLanguageChange as EventListener)
    
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("languageChange", handleLanguageChange as EventListener)
    }
  }, [])

  const t = getTranslation(language)

  const validateField = (name: string, value: string) => {
    switch (name) {
      case 'fullName':
        if (!value) return t.customers.validation.fullNameRequired
        if (value.length < 3 || value.length > 50) return t.customers.validation.fullNameLength
        if (!/^[a-zA-Z\s]+$/.test(value)) return t.customers.validation.fullNameLetters
        return ''
      case 'email':
        if (!value) return t.customers.validation.emailRequired
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return t.customers.validation.emailInvalid
        return ''
      case 'phone':
        if (!value) return t.customers.validation.phoneRequired
        if (!/^[0-9]+$/.test(value)) return t.customers.validation.phoneDigits
        if (value.length !== 10) return t.customers.validation.phoneLength
        return ''
      case 'address':
        if (!value) return t.customers.validation.addressRequired
        if (value.length < 3 || value.length > 100) return t.customers.validation.addressLength
        return ''
      default:
        return ''
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEditForm(prev => ({ ...prev, [name]: value }))
    setValidationErrors(prev => ({
      ...prev,
      [name]: validateField(name, value)
    }))
  }

  const handleViewCustomer = (customer: User) => {
    setSelectedCustomer(customer)
    setIsViewDialogOpen(true)
  }

  const handleEditCustomer = (customer: User) => {
    setSelectedCustomer(customer)
    setEditForm({
      fullName: customer.fullName,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
    })
    setValidationErrors({
      fullName: '',
      email: '',
      phone: '',
      address: '',
    })
    setIsEditDialogOpen(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCustomer) return

    // Validate all fields
    const errors = {
      fullName: validateField('fullName', editForm.fullName),
      email: validateField('email', editForm.email),
      phone: validateField('phone', editForm.phone),
      address: validateField('address', editForm.address)
    }
    
    setValidationErrors(errors)
    
    // Check if there are any validation errors
    if (Object.values(errors).some(error => error)) {
      toast.error("Please fix the validation errors before submitting")
      return
    }

    // Show confirmation dialog instead of saving immediately
    setIsConfirmSaveDialogOpen(true)
  }

  const handleConfirmSave = async () => {
    if (!selectedCustomer) return

    try {
      const updateData = {
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        address: editForm.address.trim()
      }

      await adminUpdateUserProfile({
        id: selectedCustomer._id,
        userData: updateData
      }).unwrap()
      
      // Close dialogs first
      setIsEditDialogOpen(false)
      setIsConfirmSaveDialogOpen(false)

      // Show success message with a slight delay to ensure it's visible
      setTimeout(() => {
        toast.success(
          <div className="flex flex-col gap-1">
            <p className="font-semibold">Customer Updated Successfully!</p>
            <p className="text-sm text-gray-600">The customer's information has been updated.</p>
          </div>,
          {
            duration: 5000, // Show for 5 seconds
            position: "top-right",
            style: {
              background: "#f0fdf4",
              border: "1px solid #86efac",
              color: "#166534",
            },
          }
        )
      }, 100)
    } catch (error: any) {
      if (error.status === 409) {
        toast.error("Email or phone number is already in use")
      } else if (error.status === 400) {
        toast.error("Invalid input data. Please check your information.")
      } else if (error.status === 401) {
        toast.error("Your session has expired. Please log in again.")
      } else if (error.status === 403) {
        toast.error("You don't have permission to update this customer.")
      } else {
        toast.error("Failed to update customer")
      }
    }
  }

  const handleDeleteCustomer = async (customer: User) => {
    try {
      await deleteUser(customer._id).unwrap()
      toast.success("Customer deleted successfully")
      setIsDeleteDialogOpen(false)
    } catch (error) {
      toast.error("Failed to delete customer")
    }
  }

  const handleToggleActivation = async (customer: User) => {
    try {
      await toggleUserActivation(customer._id).unwrap()
      toast.success(`Customer ${customer.isActive ? 'deactivated' : 'activated'} successfully`)
    } catch (error) {
      toast.error("Failed to update customer status")
    }
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error loading customers</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{t.customers.title}</h1>
          <p className="text-gray-500">{t.customers.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Customers</p>
                <p className="mt-1 text-3xl font-semibold">{displayCustomers?.length || 0}</p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 text-blue-800">
                <UserPlus className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">New This Month</p>
                <p className="mt-1 text-3xl font-semibold">
                  {displayCustomers?.filter((c: User) => {
                    const joinDate = new Date(c.createdAt)
                    const now = new Date()
                    return joinDate.getMonth() === now.getMonth() && 
                           joinDate.getFullYear() === now.getFullYear()
                  }).length || 0}
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3 text-purple-800">
                <UserPlus className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{t.customers.customerList}</CardTitle>
              <CardDescription>{t.customers.customerListDescription}</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder={t.customers.searchPlaceholder}
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t.customers.fields.fullName}</TableHead>
                <TableHead>{t.customers.fields.email}</TableHead>
                <TableHead>{t.customers.fields.phone}</TableHead>
                <TableHead>{t.customers.fields.joinDate}</TableHead>
                <TableHead className="text-right">{t.customers.actions.title}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayCustomers?.map((customer: User) => (
                <TableRow key={customer._id}>
                  <TableCell className="font-medium">{customer.fullName}</TableCell>
                  <TableCell>{customer.email}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell>{new Date(customer.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-100 hover:text-blue-800"
                        onClick={() => handleViewCustomer(customer)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-blue-100 hover:text-blue-800"
                        onClick={() => handleEditCustomer(customer)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-100 hover:text-red-600"
                        onClick={() => {
                          setSelectedCustomer(customer)
                          setIsDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Customer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Customer Details</DialogTitle>
            <DialogDescription>
              View detailed information about the customer
            </DialogDescription>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Full Name</h4>
                <p>{selectedCustomer.fullName}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Email</h4>
                <p>{selectedCustomer.email}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Phone</h4>
                <p>{selectedCustomer.phone || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Address</h4>
                <p>{selectedCustomer.address || 'Not provided'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Join Date</h4>
                <p>{new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <p className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                  selectedCustomer.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                }`}>
                  {selectedCustomer.isActive ? t.customers.status.active : t.customers.status.inactive}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              {t.customers.actions.close}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.customers.edit.title}</DialogTitle>
            <DialogDescription>
              {t.customers.edit.description}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="fullName">{t.customers.fields.fullName}</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={editForm.fullName}
                  onChange={handleInputChange}
                  placeholder={t.customers.placeholders.fullName}
                  className={validationErrors.fullName ? "border-red-500" : ""}
                />
                {validationErrors.fullName && (
                  <p className="text-sm text-red-500">{validationErrors.fullName}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">{t.customers.fields.email}</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={editForm.email}
                  onChange={handleInputChange}
                  placeholder={t.customers.placeholders.email}
                  className={validationErrors.email ? "border-red-500" : ""}
                />
                {validationErrors.email && (
                  <p className="text-sm text-red-500">{validationErrors.email}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">{t.customers.fields.phone}</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={editForm.phone}
                  onChange={handleInputChange}
                  placeholder={t.customers.placeholders.phone}
                  className={validationErrors.phone ? "border-red-500" : ""}
                />
                {validationErrors.phone && (
                  <p className="text-sm text-red-500">{validationErrors.phone}</p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">{t.customers.fields.address}</Label>
                <Input
                  id="address"
                  name="address"
                  value={editForm.address}
                  onChange={handleInputChange}
                  placeholder={t.customers.placeholders.address}
                  className={validationErrors.address ? "border-red-500" : ""}
                />
                {validationErrors.address && (
                  <p className="text-sm text-red-500">{validationErrors.address}</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                {t.customers.actions.cancel}
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-900 hover:bg-blue-800"
                disabled={Object.values(validationErrors).some(error => error)}
              >
                {t.customers.actions.saveChanges}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Save Dialog */}
      <Dialog open={isConfirmSaveDialogOpen} onOpenChange={setIsConfirmSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.customers.confirm.title}</DialogTitle>
            <DialogDescription>
              {t.customers.confirm.description}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">{t.customers.fields.fullName}</h4>
                <p>{editForm.fullName}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">{t.customers.fields.email}</h4>
                <p>{editForm.email}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">{t.customers.fields.phone}</h4>
                <p>{editForm.phone}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">{t.customers.fields.address}</h4>
                <p>{editForm.address}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsConfirmSaveDialogOpen(false)}
            >
              {t.customers.actions.cancel}
            </Button>
            <Button 
              type="button" 
              className="bg-blue-900 hover:bg-blue-800"
              onClick={handleConfirmSave}
            >
              {t.customers.actions.confirmChanges}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.customers.delete.title}</DialogTitle>
            <DialogDescription>
              {t.customers.delete.description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              {t.customers.actions.cancel}
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedCustomer && handleDeleteCustomer(selectedCustomer)}
            >
              {t.customers.actions.delete}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}