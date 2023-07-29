import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';
import TicketPaymentService from '../thirdparty/paymentgateway/TicketPaymentService.js';
import SeatReservationService from '../thirdparty/seatbooking/SeatReservationService.js';
import { ADULT_NEEDED, ADULT_NEEDED_FOR_INFANT, MAX_TICKETS_EXCEEDED, REQUESTS_TYPE_ERROR, REQUEST_TYPE_ERROR } from './Errors.js';
import { MAX_TICKETS, ADULT_PRICE, CHILD_PRICE } from './Constants.js';


export default class TicketService {

  #totalTickets = 0;
  #totalAdults = 0;
  #totalInfants = 0;

  #paymentService;
  #reservationService;

  constructor () {
    this.#paymentService = new TicketPaymentService();
    this.#reservationService = new SeatReservationService();
  }


  #validateId(accountId) {

    if (!Number.isInteger(accountId)) {
      throw new InvalidPurchaseException('accountId must be an integer');
    }

    if (+accountId < 1) {
      throw new InvalidPurchaseException('accountId must greater than zero');
    }
  }

  // necessary validation checks before request processing.
  #validateRequests(ticketTypeRequests){

    // check requests is an array
    if (!Array.isArray(ticketTypeRequests)) {
      throw new InvalidPurchaseException(REQUESTS_TYPE_ERROR);
    }

    ticketTypeRequests.forEach( req => {

        if (!(req instanceof TicketTypeRequest)) {
          throw new InvalidPurchaseException(REQUEST_TYPE_ERROR);
        }

        let noOfTickets = req.getNoOfTickets();

        if (req.getTicketType() === 'ADULT') {
          this.#totalAdults += noOfTickets;
        }

        else if (req.getTicketType() === 'INFANT') {
          this.#totalInfants += noOfTickets;
        }

        this.#totalTickets += noOfTickets;

        if (this.#totalTickets > MAX_TICKETS) {
          throw new InvalidPurchaseException(MAX_TICKETS_EXCEEDED);
        }
    });

    // check adult(s) present
    if (this.#totalAdults < 1 ) {
      throw new InvalidPurchaseException(ADULT_NEEDED);
    }

    if (this.#totalAdults < this.#totalInfants) {
      throw new InvalidPurchaseException(ADULT_NEEDED_FOR_INFANT);
    }

  }

  #calculateCost() {
    const totalChildren = this.#totalTickets - (this.#totalAdults + this.#totalInfants);
    const totalAdultCost = this.#totalAdults * ADULT_PRICE;
    const totalChildrenCost = totalChildren * CHILD_PRICE;
    return totalAdultCost + totalChildrenCost;
  }

  #calculateSeats() {
    return this.#totalTickets - this.#totalInfants;
  }

  purchaseTickets(accountId, ...ticketTypeRequests) {
    // throws InvalidPurchaseException

    this.#validateId(accountId);
    this.#validateRequests(...ticketTypeRequests);

    let totalSeats = this.#calculateSeats();
    let totalCost = this.#calculateCost();

    this.#paymentService.makePayment(accountId, totalCost);
    this.#reservationService.reserveSeat(accountId, totalSeats);

    return [totalCost, totalSeats]

  }
}
