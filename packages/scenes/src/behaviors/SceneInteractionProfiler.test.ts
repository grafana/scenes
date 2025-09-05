import { SceneInteractionProfiler, USER_INTERACTIONS } from './SceneInteractionProfiler';
import { InteractionProfileResult } from './types';

// Mock the captureNetwork function from SceneRenderProfiler
jest.mock('./SceneRenderProfiler', () => ({
  captureNetwork: jest.fn().mockReturnValue(50), // Mock 50ms network time
}));

describe('SceneInteractionProfiler', () => {
  let profiler: SceneInteractionProfiler;
  let mockOnProfileComplete: jest.Mock<void, [InteractionProfileResult]>;

  beforeEach(() => {
    mockOnProfileComplete = jest.fn();
    profiler = new SceneInteractionProfiler({
      enableProfiling: true,
      onProfileComplete: mockOnProfileComplete,
    });

    // Mock performance.now to return predictable values
    jest
      .spyOn(performance, 'now')
      .mockReturnValueOnce(1000) // startProfile
      .mockReturnValueOnce(1200); // stopProfile (interaction complete)

    // Mock performance.mark and performance.measure
    jest.spyOn(performance, 'mark').mockImplementation();
    jest.spyOn(performance, 'measure').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('basic functionality', () => {
    it('should start and stop profile correctly', () => {
      profiler.startProfile(USER_INTERACTIONS.ADHOC_KEYS_DROPDOWN);

      expect(profiler.isProfileActive()).toBe(true);
      expect(profiler.getCurrentInteraction()).toBe(USER_INTERACTIONS.ADHOC_KEYS_DROPDOWN);

      profiler.stopProfile();
      // Profile completes immediately without trailing frames
      expect(profiler.isProfileActive()).toBe(false);
    });

    it('should not start profile when profiling is disabled', () => {
      const disabledProfiler = new SceneInteractionProfiler({ enableProfiling: false });

      disabledProfiler.startProfile(USER_INTERACTIONS.ADHOC_KEYS_DROPDOWN);

      expect(disabledProfiler.isProfileActive()).toBe(false);
      expect(disabledProfiler.getCurrentInteraction()).toBe(null);
    });

    it('should cancel existing profile when starting a new one', () => {
      profiler.startProfile(USER_INTERACTIONS.ADHOC_KEYS_DROPDOWN);
      expect(profiler.getCurrentInteraction()).toBe(USER_INTERACTIONS.ADHOC_KEYS_DROPDOWN);

      profiler.startProfile(USER_INTERACTIONS.GROUPBY_DROPDOWN);
      expect(profiler.getCurrentInteraction()).toBe(USER_INTERACTIONS.GROUPBY_DROPDOWN);
    });
  });

  describe('profile completion', () => {
    it('should complete profile immediately', () => {
      profiler.startProfile(USER_INTERACTIONS.ADHOC_KEYS_DROPDOWN);
      profiler.stopProfile();

      expect(mockOnProfileComplete).toHaveBeenCalledWith({
        interaction: USER_INTERACTIONS.ADHOC_KEYS_DROPDOWN,
        interactionDuration: 200, // 1200 - 1000
        networkDuration: 50, // From mocked captureNetwork
        startTs: 1000,
        endTs: 1200,
      });

      expect(profiler.isProfileActive()).toBe(false);
    });

    it('should create performance marks and measures', () => {
      profiler.startProfile(USER_INTERACTIONS.GROUPBY_DROPDOWN);
      profiler.stopProfile();

      expect(performance.mark).toHaveBeenCalledWith('groupby_dropdown_start', { startTime: 1000 });
      expect(performance.mark).toHaveBeenCalledWith('groupby_dropdown_end', { startTime: 1200 });
      expect(performance.measure).toHaveBeenCalledWith(
        'Interaction_groupby_dropdown',
        'groupby_dropdown_start',
        'groupby_dropdown_end'
      );
    });
  });

  describe('interaction types', () => {
    it('should support all defined interaction types', () => {
      expect(USER_INTERACTIONS.ADHOC_KEYS_DROPDOWN).toBe('adhoc_keys_dropdown');
      expect(USER_INTERACTIONS.ADHOC_VALUES_DROPDOWN).toBe('adhoc_values_dropdown');
      expect(USER_INTERACTIONS.GROUPBY_DROPDOWN).toBe('groupby_dropdown');
    });

    it('should measure different interaction types', () => {
      const interactions = [
        USER_INTERACTIONS.ADHOC_KEYS_DROPDOWN,
        USER_INTERACTIONS.ADHOC_VALUES_DROPDOWN,
        USER_INTERACTIONS.GROUPBY_DROPDOWN,
      ];

      const mockCallback = jest.fn();
      const testProfiler = new SceneInteractionProfiler({
        enableProfiling: true,
        onProfileComplete: mockCallback,
      });

      interactions.forEach((interaction) => {
        testProfiler.startProfile(interaction);
        testProfiler.stopProfile();
      });

      expect(mockCallback).toHaveBeenCalledTimes(3);
      const results = mockCallback.mock.calls.map((call) => call[0]);
      interactions.forEach((interaction) => {
        expect(results.some((result) => result.interaction === interaction)).toBe(true);
      });
    });
  });

  describe('error handling', () => {
    it('should handle stopProfile when no profile is active', () => {
      expect(() => profiler.stopProfile()).not.toThrow();
      expect(mockOnProfileComplete).not.toHaveBeenCalled();
    });
  });
});
