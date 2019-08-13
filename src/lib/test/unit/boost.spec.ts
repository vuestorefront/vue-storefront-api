import getBoosts from '../../boost'

describe('getBoosts method', () => {
  describe('with empty boost config', () => {
    beforeEach(() => {
      jest.mock('config', () => ({}))
    })

    it('Should return 1', () => {
      const result = getBoosts('color');
      expect(result).toEqual(1);
    });
  })

  describe('with boost config', () => {
    beforeEach(() => {
      jest.mock('config', () => ({
        boost: {
          name: 3
        }
      }))
    })

    it('color not in config and should be 1', () => {
      const result = getBoosts('color');
      expect(result).toEqual(1);
    });

    it('name is in config and should be 3', () => {
      const result = getBoosts('name');
      expect(result).toEqual(3);
    });
  })
})
