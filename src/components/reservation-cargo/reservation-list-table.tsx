import { useEffect, useState } from "react";
import { ReservationDomain } from "./reservation-domain";
import { getReservation, getReservationEvent, getReservationMove, listReservationEvents, listReservationMoves, listReservations, updateReservation, updateReservationMove } from "./reservation-manager-client";

export const ReservationListTable = () => {
    const [reservationListLoaded, setReservationListLoaded] = useState<boolean>(false)
    const [reservationList, setReservationList] = useState<ReservationDomain[]>([])

    useEffect(() => {
        if (!reservationListLoaded) {
            listReservations().then(list => {
                setReservationList(list)
                getReservation(list[0].reservationId).then(item => {
                    item.status = 'Updated'
                    updateReservation(item).then(done => {
                        listReservationMoves().then(moves => {
                            getReservationMove(moves[0].moveId).then(move => {
                                move.status='UPDATED'
                                updateReservationMove(move)
                                listReservationEvents().then(events => {
                                    getReservationEvent(events[0].eventId).then(eventItem => {
                                        

                                    })
                                })
                            })
                        })

                    })
                })
                setReservationListLoaded(true)


            })
        }


    }, [reservationListLoaded])

    return (<div></div>);
}