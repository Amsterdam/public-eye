from abc import ABC, abstractmethod


class TrainConfig(ABC):

    @property
    @abstractmethod
    def criterion():
        pass

    @property
    @abstractmethod
    def optim():
        pass

    @property
    @abstractmethod
    def scheduler():
        pass

    @property
    @abstractmethod
    def train_loader():
        pass

    @property
    @abstractmethod
    def val_loader():
        pass

    @property
    @abstractmethod
    def data():
        pass

    # on of the evaluation losses should be used
    # to rank model quality
    @property
    @abstractmethod
    def defining_loss():
        pass

    @abstractmethod
    def evaluation_compute_losses():
        pass

    @abstractmethod
    def train_compute_step():
        pass

    @abstractmethod
    def aggregate_train_losses():
        pass

    @abstractmethod
    def aggregate_eval_losses():
        pass
