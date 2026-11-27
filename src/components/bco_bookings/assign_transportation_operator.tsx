import { Input } from "@aws-amplify/ui-react"
import {
  LucideChevronDown,
  LucideTramFront,
  LucideTruck,
  LucideUsers,
} from "lucide-react"
import { useState } from "react"
import {
  getUnselectableReason,
  isCargoSelectable,
} from "../cargo/cargo-availability"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu"
import { Label } from "../ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip"
import { User } from "../users/columns"
import { BCODataTableMeta } from "./data-table"

export default function TransportationCoordinator({
  row,
  table,
}: {
  row: any
  table: any
}) {
  const [data, setData] = useState<User[]>([])
  const [tempName, setTempName] = useState("")
  const [tempEmail, setTempEmail] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  // Assignment rules: cargo must be Released and hold-free.
  const isAssignDisabled = !isCargoSelectable(row.original)
  const disabledReason = getUnselectableReason(row.original)

  const handleOpen = async () => {
    if (isAssignDisabled) return
    setErrorMessage("")
    setIsDialogOpen(true)
    const result = await (
      table.options.meta as BCODataTableMeta
    )?.fetchTransportationCoordinators()
    setData(Array.isArray(result) ? result : [])
  }

  const handleOperatorSelect = (value: string) => {
    setTempEmail(value)
    const selectedUser = data.find((user) => `${user.email}` === value)
    if (selectedUser) {
      setTempName(`${selectedUser.given_name} ${selectedUser.family_name}`)
    }
  }

  async function handleSubmit() {
    if (isAssignDisabled) return
    setErrorMessage("")
    try {
      await (table.options.meta as BCODataTableMeta)?.assignTransOp(
        row.original.cargoUnitID,
        tempName,
        tempEmail,
        "Pending Transportation Coordinator Approval"
      )
      setIsDialogOpen(false)
    } catch (err: any) {
      setErrorMessage(
        err?.message || "Unable to assign Transportation Coordinator."
      )
    }
  }

  const getMenuItem = (user: User) => {
    const fullName = `${user.given_name} ${user.family_name}`
    return (
      <div className="flex" key={user.email}>
        <DropdownMenuItem onClick={() => handleOperatorSelect(user.email)}>
          {" "}
          &nbsp;&nbsp;&nbsp;&nbsp;
          {user["custom:organization"] ? user["custom:organization"] : fullName}{" "}
        </DropdownMenuItem>
      </div>
    )
  }

  const usersWithRole = (role: string) =>
    data.filter((user) => `${user["custom:role"]}` === role)

  // If either operator OR email is missing, show "Assign" button
  const isMissing =
    !row.original.transopName?.trim() || !row.original.transopEmail?.trim()

  if (isMissing) {
    return (
      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          if (!open) setIsDialogOpen(false)
        }}
      >
        <TooltipProvider>
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              {/* A disabled button doesn't fire hover events, so the span carries the tooltip */}
              <span className="inline-block" tabIndex={isAssignDisabled ? 0 : -1}>
                <Button
                  onClick={handleOpen}
                  variant="outline"
                  disabled={isAssignDisabled}
                  className="bg-blue-600 text-white hover:bg-blue-700 disabled:pointer-events-none"
                >
                  Assign
                </Button>
              </span>
            </TooltipTrigger>
            {disabledReason && (
              <TooltipContent>
                <p>{disabledReason}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Transportation Coordinator</DialogTitle>
            <DialogDescription>
              Select a Transportation Coordinator name and email to assign this
              container.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={isAssignDisabled}>
                    Select Transportation Coordinator
                    <LucideChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                  <DropdownMenuGroup>
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <LucideTramFront />
                        Rail Operators
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          {usersWithRole("Rail Operator").map(getMenuItem)}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <LucideUsers /> Third Party Logistic Providers
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          {usersWithRole(
                            "Third Party Logistics Provider"
                          ).map(getMenuItem)}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <LucideTruck /> Trucking Operators
                      </DropdownMenuSubTrigger>
                      <DropdownMenuPortal>
                        <DropdownMenuSubContent>
                          {usersWithRole("Trucking Operator").map(getMenuItem)}
                        </DropdownMenuSubContent>
                      </DropdownMenuPortal>
                    </DropdownMenuSub>
                    <DropdownMenuSeparator />
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div>
              <Label>Transportation Coordinator Email</Label>
              <Input value={tempEmail} disabled={true} />
            </div>
            {errorMessage && (
              <p className="text-sm text-red-600">{errorMessage}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isAssignDisabled || !tempName.trim() || !tempEmail.trim()}
            >
              Submit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // If both operator and email are already filled, just display operator's name
  return <span>{row.original.transopName}</span>
}