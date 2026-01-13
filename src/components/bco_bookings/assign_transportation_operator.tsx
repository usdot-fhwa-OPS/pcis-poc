import { Dialog } from "@radix-ui/react-dialog";
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { Input } from "@aws-amplify/ui-react";
import { User } from "../users/columns";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../ui/accordion";
import { useState } from "react";
import { BCODataTableMeta } from "./data-table";
import { Label } from "../ui/label";


export const assignTransportationOperator = (table: any, row: any) => {

        const [data, setData] = useState<User[]>([])
        const [tempName, setTempName] = useState("")
        const [tempEmail, setTempEmail] = useState("")
        const [isDialogOpen, setIsDialogOpen] = useState(false)
       
        const handleOpen = async () => {
          setIsDialogOpen(true)
          const result = await (table.options.meta as BCODataTableMeta)?.fetchTransportationOperators();
          setData(result)
        }

        const handleOperatorSelect = (value: string) => {
          setTempEmail(value);
          const selectedUser = data.find(
            (user) => `${user.email}` === value
          );
          if (selectedUser) {
            setTempName( `${selectedUser.given_name} ${selectedUser.family_name}`);
          }
        };

        function handleSubmit() {
          // Use the parent's updateCargo method:
          (table.options.meta as BCODataTableMeta)?.assignTransOp(row.original.containerID, tempName, tempEmail, "Pending Transportation Operator Approval")
          setIsDialogOpen(false)
        }

        const getSelectItem = (user: User) => {
            const fullName = `${user.given_name} ${user.family_name}`;
            return (
                <div className="flex">
                    <svg  width="15" height="25" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path className="padding-top-2" d="M9.875 7.5C9.875 8.81168 8.81168 9.875 7.5 9.875C6.18832 9.875 5.125 8.81168 5.125 7.5C5.125 6.18832 6.18832 5.125 7.5 5.125C8.81168 5.125 9.875 6.18832 9.875 7.5Z" fill="currentColor"></path></svg>
                    <Button  style={{ width: '50%', display: 'block' }} onClick={()=>handleOperatorSelect(user.email)} >{user["custom:organization"] ? user["custom:organization"] : fullName}</Button>
                    
                </div>

            );
        };

    return (
        <>
            
            <Dialog
                open={isDialogOpen}
                onOpenChange={(open) => {
                    setIsDialogOpen(open)

                }}
            >
                <DialogTrigger asChild>
                    <TooltipProvider>
                        <Tooltip delayDuration={300}>
                            <TooltipTrigger>
                                <Button onClick={handleOpen} variant="outline" disabled={row.original.containerStatus === "On-Ship"} className="bg-blue-600 text-white hover:bg-blue-700">Assign</Button>
                            </TooltipTrigger>
                            {row.original.containerStatus === "On-Ship" && (
                                <TooltipContent>
                                    <p>Container still on ship. Cannot assign operator yet.</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </TooltipProvider>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Assign Transportation Operator</DialogTitle>
                        <DialogDescription>
                            Enter a Transportation Operator name and email to assign this container.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <div>
                            <Label>Transportation Operator</Label>
                            <Accordion
                                type="single"
                                collapsible
                                className="w-full"
                            >
                                <AccordionItem value="item-1">


                                    <AccordionTrigger>
                                        Trucking Operators
                                    </AccordionTrigger>
                                    <AccordionContent className="flex flex-col gap-4 text-balance">
                                        <p>
                                            {data.map(user => {
                                                if ('Trucking Operator' === `${user["custom:role"]}`) {
                                                    return getSelectItem(user);
                                                }
                                            })}
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-2">

                                    <AccordionTrigger>
                                        Rail Operators
                                    </AccordionTrigger>
                                    <AccordionContent className="flex flex-col gap-4 text-balance">

                                        <p>
                                            {data.map(user => {
                                                if ('Rail Operator' === `${user["custom:role"]}`) {
                                                    return getSelectItem(user);
                                                }
                                            })}
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>
                                <AccordionItem value="item-3">

                                    <AccordionTrigger>
                                        Third Party Logistic Providers
                                    </AccordionTrigger>
                                    <AccordionContent className="flex flex-col gap-4 text-balance">
                                        <p>
                                            {data.map(user => {

                                                if ('Third Party Logistics Provider' === `${user["custom:role"]}`) {
                                                    return getSelectItem(user);
                                                }
                                            })}
                                        </p>
                                    </AccordionContent>
                                </AccordionItem>

                            </Accordion>
                        </div>
                        <div>
                            <Label>Transportation Operator Email</Label>
                            <Input
                                value={tempEmail}
                                disabled={true}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={!tempName.trim() || !tempEmail.trim()}>
                            Submit
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>


        </>
    );

}