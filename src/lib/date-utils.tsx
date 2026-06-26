import { isEqual, isFriday, isMonday, isSaturday, isSunday, isThursday, isTuesday, isWednesday, nextFriday, nextMonday, nextSaturday, nextSunday, nextThursday, nextTuesday, nextWednesday, startOfMonth } from "date-fns";

const ORDER = { First: 0, Second: 1, Third: 2, Fourth: 3, Last: 4 }
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const NEXT_DAY = [nextMonday, nextTuesday, nextWednesday, nextThursday, nextFriday, nextSaturday, nextSunday];
const IS_DAY = [isMonday, isTuesday, isWednesday, isThursday, isFriday, isSaturday, isSunday];

export const matchDayAndOrder = (date: Date, dayName: string, order: string): boolean => {

    let matched: boolean = false;
    const DAY_INDEX: number = DAY_NAMES.indexOf(dayName);
    if ((DAY_INDEX >= 0) && (DAY_INDEX <= 6)) {

        const onThe: [string, number] | undefined = Object.entries(ORDER).find(entry => entry[0] === order);
        if (onThe && onThe.length > 0) {

            try {

                if (IS_DAY[DAY_INDEX](date)) {
                    let nextFrom: Date = startOfMonth(date);
                    for (let i = 0; i <= onThe[1]; i++) {
                        nextFrom = NEXT_DAY[DAY_INDEX](nextFrom);
                    }
                    matched = isEqual(nextFrom, date);
                }

            } catch (e) {
                throw new Error(`Following exception occured e`);
            }

        } else {

            throw Error(`${order} is not a valid order.`);
        }


    } else {

        throw Error(`${dayName} is not a valid day.`);
    }

    return matched;
}