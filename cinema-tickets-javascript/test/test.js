import TicketService from '../src/pairtest/TicketService'
import assert from 'assert';
import TicketTypeRequest from '../src/pairtest/lib/TicketTypeRequest';
import { ADULT_NEEDED, ADULT_NEEDED_FOR_INFANT, INVALID_ACCOUNT_ID, INVALID_ACCOUNT_ID_TYPE, MAX_TICKETS_EXCEEDED } from '../src/pairtest/Errors';
import InvalidPurchaseException from '../src/pairtest/lib/InvalidPurchaseException';
import { ADULT_PRICE, CHILD_PRICE } from '../src/pairtest/Constants';

describe('Test TicketService', function () {

  describe('validate accountId', function () {

    it('should throw InvalidPurchaseException due to non-integer accountId', function () {

      expect(() => {
        let ticketService = new TicketService();
        ticketService.purchaseTickets('a', []) 
      }).toThrow( new InvalidPurchaseException(INVALID_ACCOUNT_ID_TYPE));

    });

    it('should throw InvalidPurchaseException due to integer being zero or less', function () {

      expect(() => {
        let ticketService = new TicketService();
        ticketService.purchaseTickets(-1, []) 
      }).toThrow( new InvalidPurchaseException(INVALID_ACCOUNT_ID));

      expect(() => {
        let ticketService = new TicketService();
        ticketService.purchaseTickets(0, []) 
      }).toThrow( new InvalidPurchaseException(INVALID_ACCOUNT_ID));

      assert.doesNotThrow(() => {
        let ticketService = new TicketService();
        ticketService.purchaseTickets(1, [ new TicketTypeRequest('ADULT', 1) ]) 
      });

    });

  });
  

  describe('validate ticketTypeRequests', function () {

    it('should throw InvalidPurchaseException due to no adult(s) present', function () {

      expect(() => {
        let ticketService = new TicketService();
        ticketService.purchaseTickets(1, [ new TicketTypeRequest('CHILD', 1), new TicketTypeRequest('INFANT', 1)]) 
      }).toThrow( new InvalidPurchaseException(ADULT_NEEDED));

      expect(() => {
        let ticketService = new TicketService();
        ticketService.purchaseTickets(1, []) 
      }).toThrow( new InvalidPurchaseException(ADULT_NEEDED));

    });

    it('should throw InvalidPurchaseException due to unattended infant', function () {

      expect(() => {
        let ticketService = new TicketService();
        ticketService.purchaseTickets(1, [ 
          new TicketTypeRequest('INFANT', 1), 
          new TicketTypeRequest('INFANT', 1), 
          new TicketTypeRequest('ADULT', 1)]) 
      }).toThrow( new InvalidPurchaseException(ADULT_NEEDED_FOR_INFANT));

    });


    it('should throw InvalidPurchaseException due to maximum tickets exceeded', function () {

      expect(() => {
        let ticketService = new TicketService();
        ticketService.purchaseTickets(1, [ 
          new TicketTypeRequest('CHILD', 20), 
          new TicketTypeRequest('ADULT', 1)]) 
      }).toThrow( new InvalidPurchaseException(MAX_TICKETS_EXCEEDED));

    });

  });

  describe('calculate cost / reservation', function () {

    it('should const the price of two adults one child and two infants', function () {

      let ticketService = new TicketService();

      const family = [ 
        new TicketTypeRequest('CHILD', 1), 
        new TicketTypeRequest('INFANT', 2), // no seats required
        new TicketTypeRequest('ADULT', 1), 
        new TicketTypeRequest('ADULT', 1)];

      const [cost, seats] = ticketService.purchaseTickets(1, family);

      assert.equal(cost, 2 * ADULT_PRICE + CHILD_PRICE );
      assert.equal(seats, 3);

    });

  });




});